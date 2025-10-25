import { Request, Response } from "express";
import { razorpay } from "../config/razorpay"; 
import Plan from "../model/plan.model";
import Transaction from "../model/transaction.model";
import User from "../model/user.model";
import { calculateGST } from "../utils/gstCalculator";
import crypto from "crypto";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId, payableAmount, userId, userDetails } = req.body;

    if (!planId) return res.status(400).json({ message: "Plan ID is required" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const gstCalcResult = await calculateGST(plan.price);
    if (!gstCalcResult.success) {
      return res.status(400).json({ message: "GST calculation failed", error: gstCalcResult.error });
    }

    const expectedPayable = gstCalcResult.data.payableAmount;
    const taxableAmount = gstCalcResult.data.taxableAmount;
    const gstAmount = gstCalcResult.data.gst;

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

    let linkedUserId = userId || null;
    let txUserDetails = userDetails;

    if (!linkedUserId) {
      if (!userDetails || !userDetails.fullName || !userDetails.email || !userDetails.phone) {
        return res.status(400).json({ message: "userDetails (fullName,email,phone) required" });
      }
    
      // Guest session remove → ab user create nahi hoga pehle
      const existingUser = await User.findOne({ email: userDetails.email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered. Please login." });
      }
    
      // userDetails sirf transaction me save karenge → user creation payment ke baad
      linkedUserId = null; 
    }
    
    

    const amountInPaise = Math.round(expectedPayable * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const transaction = await Transaction.create({
      userId: linkedUserId,
      planId,
      amount: expectedPayable,
      currency: "INR",
      status: "PENDING",
      orderId: razorpayOrder.id,
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
      order: razorpayOrder,
      transactionId: transaction._id,
      payableAmount: expectedPayable,
      taxableAmount,
      gst: gstAmount,
    });

  } catch (error: any) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    if (!transactionId) return res.status(400).json({ message: "transactionId required" });
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // === DEBUG LOGS ===
    console.log("🔹 [DEBUG] Transaction ID:", transactionId);
    console.log("🔹 [DEBUG] Received Razorpay Order ID:", razorpay_order_id);
    console.log("🔹 [DEBUG] Received Payment ID:", razorpay_payment_id);
    console.log("🔹 [DEBUG] Received Signature (from frontend):", razorpay_signature);
    console.log("🔹 [DEBUG] Generated Signature (backend):", generated_signature);
    // ===================

    // Compare signatures
    if (generated_signature !== razorpay_signature) {
      transaction.status = "FAILED";
      transaction.signature = generated_signature; 
      await transaction.save();

      return res.status(400).json({
        message: "Invalid payment signature",
        debug: {
          generated_signature,
          received_signature: razorpay_signature,
        },
      });
    }

    transaction.status = "SUCCESS";
    transaction.paymentId = razorpay_payment_id;
    transaction.signature = razorpay_signature;
    await transaction.save();

   // Payment successful → create user if not exists
let user = transaction.userId ? await User.findById(transaction.userId) : null;
if (!user) {
  // Create new user after successful payment
  user = await User.create({
    fullName: transaction.userDetails.fullName,
    email: transaction.userDetails.email,
    phone: transaction.userDetails.phone,
    password: "", // blank for now → user will set via OTP/reset
    plan: transaction.planId,
    session: "premium",
    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days, adjust via plan
  });

  // Optional: send OTP/email to set password
  // await sendOTP(user.email); // implement your OTP email flow
}


    return res.status(200).json({
      message: "Payment verified & plan subscribed",
      transaction,
      user,
      debug: {
        generated_signature,
        received_signature: razorpay_signature,
      },
    });
  } catch (error: any) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};
