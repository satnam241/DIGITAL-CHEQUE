// import { Request, Response } from "express";
// import Cheque from "../model/cheque.model";
// import Plan from "../model/plan.model";
// import Transaction from "../model/transaction.model";
// import User from "../model/user.model";

// export const getUserDetails = async (req: any, res: Response) => {
//   try {
//     const user = req.user;

//     // 🔹 Get user full document (for planExpiry)
//     const userDoc = await User.findById(user._id).populate("plan");

//     // 🔹 Get the latest active plan
//     const activePlan =
//     (await Plan.findOne({ userId: user._id, status: "active" }).sort({ createdAt: -1 })) ||
//     (await Plan.findOne({ _id: userDoc?.plan }).sort({ createdAt: -1 })) || // ✅ fallback to user's current plan
//     null;
  
//     // 🔹 Get cheque details
//     const cheque = await Cheque.findOne({ userId: user._id });

//     // 🔹 Get payment/transaction history
//     const transactions = await Transaction.find({ userId: user._id })
//     .sort({ createdAt: -1 })
//     .populate("planId", "name price durationDays")
//     .populate("userId", "name email") 
//     .select("amount status createdAt paymentId planId userId userDetails");
  
//     // 🔹 Calculate days remaining from user's planExpiry
//     let daysLeft = 0;
//     let alert = false;
//     const today = new Date();
//     let planStart: Date | null = null;
//     let planEnd: Date | null = null;

//     // ✅ Add plan expiry logic from verifyPayment
//     if (userDoc?.planExpiry) {
//       planEnd = new Date(userDoc.planExpiry);
//       const diff = planEnd.getTime() - today.getTime();
//       daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

//       // planStart = expiry - durationDays
//       const durationDays = (activePlan as any)?.durationDays || 30;
//       planStart = new Date(planEnd.getTime() - durationDays * 24 * 60 * 60 * 1000);

//       if (daysLeft <= 3) alert = true;
//     }

//     const transaction = await Transaction.find({ userId: user._id })
//     .populate("planId", "name price")
//     .sort({ createdAt: -1 })
//     .lean();

//     // 🔹 Usage analytics (optional)
//     const allPlans = await Plan.find({ userId: user._id });
//     const todayMidnight = new Date(today.setHours(0, 0, 0, 0));
//     const last3Days = new Date(todayMidnight);
//     last3Days.setDate(last3Days.getDate() - 3);
//     const last30Days = new Date(todayMidnight);
//     last30Days.setDate(last30Days.getDate() - 30);

//     let usageStats = {
//       lastDay: 0,
//       last3Days: 0,
//       last30Days: 0,
//     };

//     for (const plan of allPlans) {
//       if (!plan.startDate || !plan.endDate || !plan.dailyLimit) continue;

//       const activeDays = Math.ceil(
//         (Math.min(today.getTime(), plan.endDate.getTime()) -
//           plan.startDate.getTime()) /
//           (1000 * 60 * 60 * 24)
//       );

//       if (activeDays >= 1) usageStats.lastDay += plan.dailyLimit;
//       if (activeDays >= 3) usageStats.last3Days += plan.dailyLimit * 3;
//       if (activeDays >= 30) usageStats.last30Days += plan.dailyLimit * 30;
//     }

//     // 🔹 Send final response (added planStart, planEnd, countdown)
//     return res.status(200).json({
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name || user.fullName || "User",
//         plan: activePlan ? activePlan.name : "",
//         planStart: planStart,
//         planEnd: planEnd,
//       },
//       cheques: {
//         total: cheque?.total || 0,
//         used: cheque?.used || 0,
//         remaining: cheque ? cheque.total - cheque.used : 0,
//         history: cheque?.history || [],
//       },
//       payments: transactions.map((t) => ({
//         userName:
//           (t.userId as any)?.name ||
//           (t.userDetails && (t.userDetails as any).fullName) ||
//           "Unknown User",
//         amount: t.amount,
//         status: t.status,
//         date: t.createdAt,
//         paymentId: t.paymentId,
//         planName: (t.planId as any)?.name || "N/A",
//         planPrice: (t.planId as any)?.price || 0,
//         duration: (t.planId as any)?.durationDays || 0,
//       })),
      
//       usage: usageStats,
//       countdown: daysLeft,
//       alert,
//       transaction // ⚠️ add this flag for frontend alert
//     });
//   } catch (err) {
//     console.error("Dashboard error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// // ✅ Update password
// export const updatePassword = async (req: any, res: Response) => {
//   try {
//     const userId = req.user._id;
//     const { oldPassword, newPassword } = req.body;

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

//     const hashed = await bcrypt.hash(newPassword, 10);
//     user.password = hashed;
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (err) {
//     console.error("Update password error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

import { Request, Response } from "express";
import Cheque from "../model/cheque.model";
import Plan from "../model/plan.model";
import Transaction from "../model/transaction.model";
import User from "../model/user.model";
import bcrypt from "bcryptjs";

export const getUserDetails = async (req: any, res: Response) => {
  try {
    const user = req.user;

    // 🔹 Get complete user document
    const userDoc = await User.findById(user._id).populate("plan");

    // 🔹 Get active plan (from user's plan OR last active)
    const activePlan =
      (await Plan.findOne({ userId: user._id, status: "active" }).sort({ createdAt: -1 })) ||
      (await Plan.findById(userDoc?.plan).sort({ createdAt: -1 })) ||
      null;

    // 🔹 Get cheque info
    const cheque = await Cheque.findOne({ userId: user._id });

    // 🔹 Get all transactions with populated user + plan info
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("planId", "name price durationDays")
      .populate("userId", "name email")
      .select("amount status createdAt paymentId planId userId userDetails");

    // 🔹 Plan expiry countdown logic
    let daysLeft = 0;
    let alert = false;
    let planStart: Date | null = null;
    let planEnd: Date | null = null;

    const today = new Date();

    if (userDoc?.planExpiry) {
      planEnd = new Date(userDoc.planExpiry);
      const diff = planEnd.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

      const durationDays = (activePlan as any)?.durationDays || 30;
      planStart = new Date(planEnd.getTime() - durationDays * 24 * 60 * 60 * 1000);

      if (daysLeft <= 3) alert = true;
    }

    // 🔹 Send final response
    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: userDoc?.name?.trim() || user.name || user.email?.split("@")[0] || "User",
        plan: activePlan ? activePlan.name : "",
        planStart,
        planEnd,
      },
      cheques: {
        total: cheque?.total || 0,
        used: cheque?.used || 0,
        remaining: cheque ? cheque.total - cheque.used : 0,
        history: cheque?.history || [],
      },
      payments: transactions.map((t) => ({
        userName:
          (t.userId as any)?.name ||
          (t.userDetails && (t.userDetails as any).fullName) ||
          "Unknown User",
        amount: t.amount,
        status: t.status,
        date: t.createdAt,
        paymentId: t.paymentId,
        planName: (t.planId as any)?.name || "N/A",
        planPrice: (t.planId as any)?.price || 0,
        duration: (t.planId as any)?.durationDays || 0,
      })),
      countdown: daysLeft,
      alert,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized: Missing user" });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Both old and new passwords are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password)
      return res.status(400).json({ message: "This account has no password set. Please reset via OTP." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Update password error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
