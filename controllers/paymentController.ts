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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1️⃣ Find transaction
    const transaction = await Transaction.findOne({ orderId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // 2️⃣ Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.status(400).json({ message: "Invalid signature, payment verification failed" });
    }

    // 3️⃣ Update transaction success
    transaction.paymentId = razorpay_payment_id;
    transaction.signature = razorpay_signature;
    transaction.status = "SUCCESS";
    await transaction.save();

    // 4️⃣ Fetch plan details
    const planDoc = await Plan.findById(transaction.planId);
    const durationDays = (planDoc as any)?.durationDays || 30;
    const planStart = new Date();
    const planEnd = new Date(planStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const countdown = Math.max(0, Math.ceil((planEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // 5️⃣ Handle user linking
    let user = transaction.userId ? await User.findById(transaction.userId) : null;

    // 🟢 If user not found — create new
    if (!user) {
      const fullName =
      transaction.userDetails?.fullName?.trim() ||
      transaction.userDetails?.name?.trim() ||
      user?.name ||
      "User";
    

      user = await User.create({
        name: fullName,
        email: transaction.userDetails?.email || "",
        phone: transaction.userDetails?.phone || "",
        password: "",
        plan: transaction.planId,
        session: "active",
        planExpiry: planEnd,
      });

      transaction.userId = user._id;
      await transaction.save();
    } else {
      // 🟡 If user exists — update plan info
      user.plan = transaction.planId;
      user.planExpiry = planEnd;
      user.session = "active";
      await user.save();
    }

    // 6️⃣ Update plan link
    await Plan.findByIdAndUpdate(transaction.planId, {
      userId: user._id,
      status: "active",
    });

    // 7️⃣ Populate for return
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("planId", "name price durationDays")
      .populate("userId", "name email phone");

    // ✅ Final Response
    return res.status(200).json({
      message: "✅ Payment verified & plan subscribed successfully",
      transaction: populatedTransaction,
      user,
      planStart,
      planEnd,
      countdown,
    });
  } catch (error: any) {
    console.error("verifyPayment error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
};
