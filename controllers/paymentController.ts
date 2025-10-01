import { Request, Response } from "express";
import razorpay from "../config/razorpay";
import Plan from "../model/plan.model";
import Transaction from "../model/transaction.model";
import User from "../model/user.model"; // optional use
import crypto from "crypto";

/**
 * @desc Create Razorpay Order
 * @route POST /api/payment/create
 * @access Public
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId, payableAmount, userDetails } = req.body;

    if (!planId) return res.status(400).json({ message: "Plan ID is required" });
    if (!payableAmount || payableAmount <= 0)
      return res.status(400).json({ message: "Valid payable amount is required" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // ✅ Razorpay order create
    const options = {
      amount: Math.round(payableAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);

    // ✅ Save transaction (without userId required)
    const transaction = await Transaction.create({
      planId,
      amount: payableAmount,
      currency: "INR",
      status: "PENDING",
      orderId: order.id,
      userDetails: userDetails || {}, // store email, phone etc.
    });

    return res.status(200).json({ order, transactionId: transaction._id });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

/**
 * @desc Verify Razorpay Payment
 * @route POST /api/payment/verify
 * @access Public
 */
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId, planId } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // ❌ Invalid signature
    if (generated_signature !== razorpay_signature) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.status(400).json({ message: "Invalid payment signature", transaction });
    }

    // ✅ Success
    transaction.status = "SUCCESS";
    transaction.paymentId = razorpay_payment_id;
    transaction.signature = razorpay_signature;
    await transaction.save();

    const plan = await Plan.findById(planId);

    return res.status(200).json({
      message: "Payment verified successfully",
      transaction,
      plan,
      amountPaid: transaction.amount,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};
