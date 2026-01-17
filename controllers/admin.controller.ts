import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../model/user.model";
import Plan from "../model/plan.model";
import Transaction from "../model/transaction.model";

/**
 * 🧾 Get all users with their active plan details
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .populate("plan", "name price durationDays gstRate")
      .select("fullName email phone session createdAt")
      .lean();

    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, error: err });
  }
};

/**
 * 🔄 Toggle user activation (Activate / Deactivate)
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
  
      const newStatus = user.session === "inactive" ? "free" : "inactive";
  
      // Directly update
      await User.findByIdAndUpdate(userId, { session: newStatus });
  
      res.json({ success: true, message: `User ${newStatus === "inactive" ? "deactivated" : "activated"}`, session: newStatus });
    } catch (err) {
      console.error("Error toggling user status:", err);
      res.status(500).json({ success: false, error: err });
    }
  };
  

/**
 * 💰 Update GST rate for a plan
 */
export const updatePlanGST = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const { gstRate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ success: false, message: "Invalid plan ID" });
    }

    const plan = await Plan.findById(planId);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    (plan as any).gstRate = gstRate;
    await plan.save();

    res.json({
      success: true,
      message: `GST updated to ${gstRate}% for plan ${plan.name}`,
      plan,
    });
  } catch (err) {
    console.error("Error updating GST:", err);
    res.status(500).json({ success: false, error: err });
  }
};

// Create Plan
export const createPlan = async (req: Request, res: Response) => {
    try {
      const { name, price, cheques, durationDays } = req.body;
      const plan = await Plan.create({ name, price, cheques, durationDays });
      res.json({ success: true, plan });
    } catch (err) {
      res.status(500).json({ success: false, error: err });
    }
  };
  
  // Get all Plans
  export const getPlans = async (req: Request, res: Response) => {
    try {
      const plans = await Plan.find();
      res.json({ success: true, plans });
    } catch (err) {
      res.status(500).json({ success: false, error: err });
    }
  };
  
  // Update Plan
  export const updatePlan = async (req: Request, res: Response) => {
    try {
      const { planId } = req.params;
      const updates = req.body;
      const plan = await Plan.findByIdAndUpdate(planId, updates, { new: true });
      if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
      res.json({ success: true, plan });
    } catch (err) {
      res.status(500).json({ success: false, error: err });
    }
  };
  
  // Delete Plan
  export const deletePlan = async (req: Request, res: Response) => {
    try {
      const { planId } = req.params;
      const plan = await Plan.findByIdAndDelete(planId);
      if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
      res.json({ success: true, message: "Plan deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err });
    }
  };
  

/**
 * 📦 Get all transactions with user and plan info
 */
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find()
      .populate("planId", "name price durationDays gstRate")
      .populate("userId", "fullName email phone session")
      .lean();

    res.json({ success: true, transactions });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, error: err });
  }
};

/**
 * 📊 Monthly earnings summary for dashboard graph
 */
export const getMonthlyEarnings = async (req: Request, res: Response) => {
  try {
    const earnings = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
          totalGST: { $sum: "$gstAmount" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({ success: true, earnings });
  } catch (err) {
    console.error("Error fetching monthly earnings:", err);
    res.status(500).json({ success: false, error: err });
  }
};
