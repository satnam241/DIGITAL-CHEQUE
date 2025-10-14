import { Request, Response } from "express";
import { razorpay } from "../config/razorpay"; 
import Plan from "../model/plan.model";
import Transaction from "../model/transaction.model";
import User from "../model/user.model";
import crypto from "crypto";
import { calculateGstForAmount } from "../utils/gstCalculator";

/**
 * Create Razorpay Order
 * Accepts:
 *  - planId (required)
 *  - payableAmount (sent by client but validated server-side)
 *  - userId (optional) OR userDetails { fullName, email, phone, companyName?, gstNo?, address?, city?, state? }
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId, payableAmount, userId, userDetails } = req.body;

    if (!planId) return res.status(400).json({ message: "Plan ID is required" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Recalculate on server to prevent client tampering
    const serverCalc = calculateGstForAmount(plan.price);
    const expectedPayable = serverCalc.payableAmount;

    // If client sent payableAmount, check match (allow tiny rounding diff)
    if (typeof payableAmount === "number") {
      const diff = Math.abs(expectedPayable - Number(payableAmount));
      if (diff > 0.5) {
        return res.status(400).json({
          message: "Payable amount mismatch",
          expected: expectedPayable,
          provided: payableAmount,
        });
      }
    }

    // Ensure we have userDetails (if userId not provided)
    let linkedUserId = userId || null;
    let txUserDetails = userDetails;

    if (!linkedUserId) {
      // If userDetails missing, refuse
      if (!userDetails || !userDetails.fullName || !userDetails.email || !userDetails.phone) {
        return res.status(400).json({ message: "userId or userDetails (fullName,email,phone) required" });
      }

      // Try find existing user by email or phone, else create guest user
      const existing = await User.findOne({
        $or: [{ email: userDetails.email }, { phone: userDetails.phone }],
      });

      if (existing) {
        linkedUserId = existing._id;
        // Update fields from provided userDetails
        existing.fullName = userDetails.fullName || existing.fullName;
        existing.companyName = userDetails.companyName || existing.companyName;
        existing.gstNo = userDetails.gstNo || existing.gstNo;
        existing.address = userDetails.address || existing.address;
        existing.city = userDetails.city || existing.city;
        existing.state = userDetails.state || existing.state;
        await existing.save();
      } else {
        const newUser = await User.create({
          fullName: userDetails.fullName,
          email: userDetails.email,
          phone: userDetails.phone,
          companyName: userDetails.companyName || null,
          gstNo: userDetails.gstNo || null,
          address: userDetails.address || null,
          city: userDetails.city || null,
          state: userDetails.state || null,
          session: "guest",
        });
        linkedUserId = newUser._id;
      }
    }

    // Create razorpay order
    const amountInPaise = Math.round(expectedPayable * 100); // server computed
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save transaction
    const transaction = await Transaction.create({
      userId: linkedUserId,
      planId,
      amount: expectedPayable,
      currency: "INR",
      status: "PENDING",
      orderId: order.id,
      userDetails: {
        fullName: userDetails?.fullName || "",
        email: userDetails?.email || "",
        phone: userDetails?.phone || "",
        companyName: userDetails?.companyName || null,
        gstNo: userDetails?.gstNo || null,
        address: userDetails?.address || null,
        city: userDetails?.city || null,
        state: userDetails?.state || null,
      },
    });

    return res.status(200).json({
      message: "Order created",
      order,
      transactionId: transaction._id,
      payableAmount: expectedPayable,
      taxableAmount: serverCalc.taxableAmount,
      gst: serverCalc.gst,
    });
  } catch (error: any) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

/**
 * Verify Razorpay Payment & subscribe user
 * Expects:
 *  - razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    if (!transactionId) return res.status(400).json({ message: "transactionId required" });
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update transaction
    transaction.status = "SUCCESS";
    transaction.paymentId = razorpay_payment_id;
    transaction.signature = razorpay_signature;
    await transaction.save();

    // Activate plan for user
    const user = transaction.userId ? await User.findById(transaction.userId) : null;
    const plan = await Plan.findById(transaction.planId);

    if (user && plan) {
      const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

      user.plan = plan._id;
      user.chequeCounter = plan.cheques;
      user.monthCounter = Math.round(plan.durationDays / 30);
      user.planExpiry = expiryDate;
      user.session = "premium";
      await user.save();
    }

    return res.status(200).json({
      message: "Payment verified & plan subscribed",
      transaction,
      user,
    });
  } catch (error: any) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};
