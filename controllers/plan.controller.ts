import { Request, Response } from "express";
import Plan from "../model/plan.model";

// Create plan (admin)
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, price, cheques, durationDays } = req.body;
    const plan = new Plan({ name, price, cheques, durationDays });
    await plan.save();
    res.status(201).json(plan);
  } catch (error: any) {
    console.error("createPlan:", error);
    res.status(500).json({ message: "Error creating plan", error: error.message });
  }
};

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error: any) {
    console.error("getPlans:", error);
    res.status(500).json({ message: "Error fetching plans", error: error.message });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, cheques, durationDays } = req.body;
    const plan = await Plan.findByIdAndUpdate(id, { name, price, cheques, durationDays }, { new: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan updated", plan });
  } catch (error: any) {
    console.error("updatePlan:", error);
    res.status(500).json({ message: "Error updating plan", error: error.message });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan deleted" });
  } catch (error: any) {
    console.error("deletePlan:", error);
    res.status(500).json({ message: "Error deleting plan", error: error.message });
  }
};


// ✅ Subscribe User to a Plan (One-time)
export const subscribePlan = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    const user = await User.findById(userId);
    const plan = await Plan.findById(planId);

    if (!user || !plan) return res.status(404).json({ message: "User or Plan not found" });

    // ✅ Check if user already has a plan
    if (user.plan && user.planExpiry && user.planExpiry > new Date()) {
      return res.status(400).json({ message: "User already has an active plan" });
    }

    // ✅ Set plan details
    const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    user.plan = plan._id;
    user.chequeCounter = plan.cheques;   // ✅ Set cheque counter
    user.monthCounter = plan.durationDays / 30; // ✅ Approximate month counter
    user.planExpiry = expiryDate;

    await user.save();

    res.json({
      message: "Plan subscribed successfully",
      user: {
        name: user.name,
        email: user.email,
        plan: plan.name,
        chequeCounter: user.chequeCounter,
        monthCounter: user.monthCounter,
        planExpiry: user.planExpiry,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error subscribing to plan", error });
  }
};

// ✅ Check & Auto-Downgrade Expired Plans
export const checkExpiredPlans = async () => {
  try {
    const now = new Date();
    const expiredUsers = await User.find({ planExpiry: { $lte: now } });

    for (const user of expiredUsers) {
      user.plan = undefined;
      user.chequeCounter = 0;
      user.monthCounter = 0;
      user.planExpiry = undefined;
      user.session = "free"; // ✅ Move user to free session
      await user.save();
    }
  } catch (error) {
    console.error("Error checking expired plans:", error);
  }
};
