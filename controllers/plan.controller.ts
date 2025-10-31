import { Request, Response } from "express";
import Plan from "../model/plan.model";
import User from "../model/user.model";

/**
 * 🔹 Create new plan (Admin only)
 */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, price, cheques, durationDays } = req.body;

    const existing = await Plan.findOne({ name });
    if (existing) return res.status(400).json({ message: "Plan name already exists" });

    const plan = await Plan.create({ name, price, cheques, durationDays });
    res.status(201).json({ message: "Plan created successfully", plan });
  } catch (error: any) {
    console.error("createPlan:", error);
    res.status(500).json({ message: "Error creating plan", error: error.message });
  }
};

/**
 * 🔹 Get all plans
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error: any) {
    console.error("getPlans:", error);
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};

/**
 * 🔹 Update plan details
 */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, cheques, durationDays } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      id,
      { name, price, cheques, durationDays },
      { new: true }
    );

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    res.json({ message: "Plan updated successfully", plan });
  } catch (error: any) {
    console.error("updatePlan:", error);
    res.status(500).json({ message: "Error updating plan", error: error.message });
  }
};

/**
 * 🔹 Delete plan (Admin)
 */
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    console.error("deletePlan:", error);
    res.status(500).json({ message: "Error deleting plan", error: error.message });
  }
};

/**
 * 🔹 Manually subscribe a user to a plan (Admin only)
 */
export const subscribePlan = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    const user = await User.findById(userId);
    const plan = await Plan.findById(planId);

    if (!user || !plan) return res.status(404).json({ message: "User or Plan not found" });

    // Prevent double subscription
    if (user.plan && user.planExpiry && user.planExpiry > new Date()) {
      return res.status(400).json({ message: "User already has an active plan" });
    }

    // Set expiry date
    const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Update user details
    user.plan = plan._id;
    user.chequeCounter = plan.cheques;
    user.planExpiry = expiryDate;
    user.session = "premium";
    await user.save();

    return res.status(200).json({
      message: "Plan subscribed successfully",
      user: {
        fullName: user.fullName,
        email: user.email,
        plan: plan.name,
        planExpiry: expiryDate,
        chequeCounter: user.chequeCounter,
      },
    });
  } catch (error: any) {
    console.error("subscribePlan:", error);
    res.status(500).json({ message: "Error subscribing to plan", error: error.message });
  }
};

/**
 * 🔹 Auto downgrade users whose plan expired
 */
export const checkExpiredPlans = async () => {
  try {
    const now = new Date();
    const expiredUsers = await User.find({
      planExpiry: { $lte: now },
      session: { $ne: "free" },
    });

    for (const user of expiredUsers) {
      user.plan = undefined;
      user.chequeCounter = 0;
      user.planExpiry = undefined;
      user.session = "free";
      await user.save();
    }

    if (expiredUsers.length > 0) {
      console.log(`✅ Downgraded ${expiredUsers.length} expired users`);
    }
  } catch (error) {
    console.error("Error checking expired plans:", error);
  }
};
