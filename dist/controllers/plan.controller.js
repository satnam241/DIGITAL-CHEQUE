"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredPlans = exports.subscribePlan = exports.deletePlan = exports.updatePlan = exports.getPlans = exports.createPlan = void 0;
const plan_model_1 = __importDefault(require("../model/plan.model"));
const user_model_1 = __importDefault(require("../model/user.model"));
/**
 * 🔹 Create new plan (Admin only)
 */
const createPlan = async (req, res) => {
    try {
        const { name, price, cheques, durationDays } = req.body;
        const existing = await plan_model_1.default.findOne({ name });
        if (existing)
            return res.status(400).json({ message: "Plan name already exists" });
        const plan = await plan_model_1.default.create({ name, price, cheques, durationDays });
        res.status(201).json({ message: "Plan created successfully", plan });
    }
    catch (error) {
        console.error("createPlan:", error);
        res.status(500).json({ message: "Error creating plan", error: error.message });
    }
};
exports.createPlan = createPlan;
/**
 * 🔹 Get all plans
 */
const getPlans = async (req, res) => {
    try {
        const plans = await plan_model_1.default.find().sort({ price: 1 });
        res.json(plans);
    }
    catch (error) {
        console.error("getPlans:", error);
        res.status(500).json({ message: "Error fetching plans", error: error.message });
    }
};
exports.getPlans = getPlans;
/**
 * 🔹 Update plan details
 */
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, cheques, durationDays } = req.body;
        const plan = await plan_model_1.default.findByIdAndUpdate(id, { name, price, cheques, durationDays }, { new: true });
        if (!plan)
            return res.status(404).json({ message: "Plan not found" });
        res.json({ message: "Plan updated successfully", plan });
    }
    catch (error) {
        console.error("updatePlan:", error);
        res.status(500).json({ message: "Error updating plan", error: error.message });
    }
};
exports.updatePlan = updatePlan;
/**
 * 🔹 Delete plan (Admin)
 */
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await plan_model_1.default.findByIdAndDelete(id);
        if (!plan)
            return res.status(404).json({ message: "Plan not found" });
        res.json({ message: "Plan deleted successfully" });
    }
    catch (error) {
        console.error("deletePlan:", error);
        res.status(500).json({ message: "Error deleting plan", error: error.message });
    }
};
exports.deletePlan = deletePlan;
/**
 * 🔹 Manually subscribe a user to a plan (Admin only)
 */
const subscribePlan = async (req, res) => {
    try {
        const { userId, planId } = req.body;
        const user = await user_model_1.default.findById(userId);
        const plan = await plan_model_1.default.findById(planId);
        if (!user || !plan)
            return res.status(404).json({ message: "User or Plan not found" });
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
    }
    catch (error) {
        console.error("subscribePlan:", error);
        res.status(500).json({ message: "Error subscribing to plan", error: error.message });
    }
};
exports.subscribePlan = subscribePlan;
/**
 * 🔹 Auto downgrade users whose plan expired
 */
const checkExpiredPlans = async () => {
    try {
        const now = new Date();
        const expiredUsers = await user_model_1.default.find({
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
    }
    catch (error) {
        console.error("Error checking expired plans:", error);
    }
};
exports.checkExpiredPlans = checkExpiredPlans;
