// controllers/paymentController.ts
import { Request, Response } from "express";
import razorpay from "../config/razorpay";
import Plan from "../model/plan.model";
import crypto from "crypto";

// Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Create Razorpay order
    const options = {
      amount: plan.price * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ order, plan });
  } catch (error) {
    res.status(500).json({ message: "Error creating Razorpay order", error });
  }
};

// Verify payment
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      res.json({ message: "Payment verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid payment signature" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying payment", error });
  }
};
