import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Cheque from "../model/cheque.model";
import Plan from "../model/plan.model";
import User from "../model/user.model";
import Transaction from "../model/transaction.model"; // <-- ensure you have a transaction model

// ✅ Dashboard main route (all info together)
export const getUserDetails = async (req: any, res: Response) => {
  try {
    const user = req.user;

    // Plan
    const activePlan = await Plan.findOne({ userId: user._id, status: "active" }).sort({ createdAt: -1 });

    // Cheque info
    const cheque = await Cheque.findOne({ userId: user._id });

    // Payment history
    const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });

    // Usage stats
    const today = new Date();
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    let lastDay = 0;
    let last3Days = 0;
    let last30Days = 0;

    const plans = await Plan.find({ userId: user._id });
    for (const plan of plans) {
      const planStart = plan.startDate;
      const planEnd = plan.endDate;

      // Overlap calculation
      const start1 = planStart > oneDayAgo ? planStart : oneDayAgo;
      const end1 = planEnd < today ? planEnd : today;
      lastDay += Math.max(0, Math.ceil((end1.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24))) * plan.dailyLimit;

      const start3 = planStart > threeDaysAgo ? planStart : threeDaysAgo;
      const end3 = planEnd < today ? planEnd : today;
      last3Days += Math.max(0, Math.ceil((end3.getTime() - start3.getTime()) / (1000 * 60 * 60 * 24))) * plan.dailyLimit;

      const start30 = planStart > thirtyDaysAgo ? planStart : thirtyDaysAgo;
      const end30 = planEnd < today ? planEnd : today;
      last30Days += Math.max(0, Math.ceil((end30.getTime() - start30.getTime()) / (1000 * 60 * 60 * 24))) * plan.dailyLimit;
    }

    // Countdown (days left in active plan)
    let daysLeft = 0;
    if (activePlan && activePlan.endDate) {
      const diff = activePlan.endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: activePlan ? activePlan.name : "Free",
      },
      cheques: {
        total: cheque ? cheque.total : 0,
        used: cheque ? cheque.used : 0,
        history: cheque ? cheque.history || [] : [], // ensure you track history in schema
      },
      payments: transactions, // full transaction list
      usage: {
        lastDay,
        last3Days,
        last30Days,
      },
      countdown: daysLeft,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update password
export const updatePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
