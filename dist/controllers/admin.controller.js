"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyEarnings = exports.getAllTransactions = exports.deletePlan = exports.updatePlan = exports.getPlans = exports.createPlan = exports.updatePlanGST = exports.toggleUserStatus = exports.getAllUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../model/user.model"));
const plan_model_1 = __importDefault(require("../model/plan.model"));
const transaction_model_1 = __importDefault(require("../model/transaction.model"));
/**
 * 🧾 Get all users with their active plan details
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await user_model_1.default.find()
            .populate("plan", "name price durationDays gstRate")
            .select("fullName email phone session createdAt")
            .lean();
        res.json({ success: true, users });
    }
    catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, error: err });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * 🔄 Toggle user activation (Activate / Deactivate)
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });
        const newStatus = user.session === "inactive" ? "free" : "inactive";
        // Directly update
        await user_model_1.default.findByIdAndUpdate(userId, { session: newStatus });
        res.json({ success: true, message: `User ${newStatus === "inactive" ? "deactivated" : "activated"}`, session: newStatus });
    }
    catch (err) {
        console.error("Error toggling user status:", err);
        res.status(500).json({ success: false, error: err });
    }
};
exports.toggleUserStatus = toggleUserStatus;
/**
 * 💰 Update GST rate for a plan
 */
const updatePlanGST = async (req, res) => {
    try {
        const { planId } = req.params;
        const { gstRate } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ success: false, message: "Invalid plan ID" });
        }
        const plan = await plan_model_1.default.findById(planId);
        if (!plan)
            return res.status(404).json({ success: false, message: "Plan not found" });
        plan.gstRate = gstRate;
        await plan.save();
        res.json({
            success: true,
            message: `GST updated to ${gstRate}% for plan ${plan.name}`,
            plan,
        });
    }
    catch (err) {
        console.error("Error updating GST:", err);
        res.status(500).json({ success: false, error: err });
    }
};
exports.updatePlanGST = updatePlanGST;
// Create Plan
const createPlan = async (req, res) => {
    try {
        const { name, price, cheques, durationDays } = req.body;
        const plan = await plan_model_1.default.create({ name, price, cheques, durationDays });
        res.json({ success: true, plan });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err });
    }
};
exports.createPlan = createPlan;
// Get all Plans
const getPlans = async (req, res) => {
    try {
        const plans = await plan_model_1.default.find();
        res.json({ success: true, plans });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err });
    }
};
exports.getPlans = getPlans;
// Update Plan
const updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const updates = req.body;
        const plan = await plan_model_1.default.findByIdAndUpdate(planId, updates, { new: true });
        if (!plan)
            return res.status(404).json({ success: false, message: "Plan not found" });
        res.json({ success: true, plan });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err });
    }
};
exports.updatePlan = updatePlan;
// Delete Plan
const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await plan_model_1.default.findByIdAndDelete(planId);
        if (!plan)
            return res.status(404).json({ success: false, message: "Plan not found" });
        res.json({ success: true, message: "Plan deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err });
    }
};
exports.deletePlan = deletePlan;
/**
 * 📦 Get all transactions with user and plan info
 */
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await transaction_model_1.default.find()
            .populate("planId", "name price durationDays gstRate")
            .populate("userId", "fullName email phone session")
            .lean();
        res.json({ success: true, transactions });
    }
    catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ success: false, error: err });
    }
};
exports.getAllTransactions = getAllTransactions;
/**
 * 📊 Monthly earnings summary for dashboard graph
 */
const getMonthlyEarnings = async (req, res) => {
    try {
        const earnings = await transaction_model_1.default.aggregate([
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
    }
    catch (err) {
        console.error("Error fetching monthly earnings:", err);
        res.status(500).json({ success: false, error: err });
    }
};
exports.getMonthlyEarnings = getMonthlyEarnings;
