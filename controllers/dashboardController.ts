import { Request, Response } from "express";
import Cheque from "../model/cheque.model";
import Plan from "../model/plan.model";
import User from "../model/user.model";

// Get user details for dashboard
export const getUserDetails = async (req: any, res: Response) => {
  try {
    const user = req.user;

    // Fetch user's cheque info
    const cheque = await Cheque.findOne({ userId: user._id });

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.planName || "Free",
      totalCheques: cheque ? cheque.total : 0,
      usedCheques: cheque ? cheque.used : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get usage stats for last day, last 3 days, last 30 days
export const getUsageStats = async (req: any, res: Response) => {
  try {
    const userId = req.params.userId;
    const plans = await Plan.find({ userId });

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

    res.status(200).json({
      lastDay,
      last3Days,
      last30Days,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
