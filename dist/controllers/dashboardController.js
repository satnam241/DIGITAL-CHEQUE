"use strict";
// import { Request, Response } from "express";
// import Cheque from "../model/cheque.model";
// import Plan from "../model/plan.model";
// import Transaction from "../model/transaction.model";
// import User from "../model/user.model";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.getUserDetails = void 0;
const cheque_model_1 = __importDefault(require("../model/cheque.model"));
const plan_model_1 = __importDefault(require("../model/plan.model"));
const transaction_model_1 = __importDefault(require("../model/transaction.model"));
const user_model_1 = __importDefault(require("../model/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUserDetails = async (req, res) => {
    try {
        const user = req.user;
        // 🔹 Get complete user document
        const userDoc = await user_model_1.default.findById(user._id).populate("plan");
        // 🔹 Get active plan (from user's plan OR last active)
        const activePlan = (await plan_model_1.default.findOne({ userId: user._id, status: "active" }).sort({ createdAt: -1 })) ||
            (await plan_model_1.default.findById(userDoc?.plan).sort({ createdAt: -1 })) ||
            null;
        // 🔹 Get cheque info
        const cheque = await cheque_model_1.default.findOne({ userId: user._id });
        // 🔹 Get all transactions with populated user + plan info
        const transactions = await transaction_model_1.default.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .populate("planId", "name price durationDays")
            .populate("userId", "name email")
            .select("amount status createdAt paymentId planId userId userDetails");
        // 🔹 Plan expiry countdown logic
        let daysLeft = 0;
        let alert = false;
        let planStart = null;
        let planEnd = null;
        const today = new Date();
        if (userDoc?.planExpiry) {
            planEnd = new Date(userDoc.planExpiry);
            const diff = planEnd.getTime() - today.getTime();
            daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            const durationDays = activePlan?.durationDays || 30;
            planStart = new Date(planEnd.getTime() - durationDays * 24 * 60 * 60 * 1000);
            if (daysLeft <= 3)
                alert = true;
        }
        // 🔹 Send final response
        return res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: userDoc?.fullName?.trim() ||
                    user.fullName ||
                    user.email?.split("@")[0] ||
                    "User",
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
                userName: t.userId?.name ||
                    (t.userDetails && t.userDetails.fullName) ||
                    "Unknown User",
                amount: t.amount,
                status: t.status,
                date: t.createdAt,
                paymentId: t.paymentId,
                planName: t.planId?.name || "N/A",
                planPrice: t.planId?.price || 0,
                duration: t.planId?.durationDays || 0,
            })),
            countdown: daysLeft,
            alert,
        });
    }
    catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getUserDetails = getUserDetails;
const updatePassword = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized: Missing user" });
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            return res.status(400).json({ message: "Both old and new passwords are required" });
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (!user.password)
            return res.status(400).json({ message: "This account has no password set. Please reset via OTP." });
        const isMatch = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Old password is incorrect" });
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        return res.json({ message: "Password updated successfully" });
    }
    catch (err) {
        console.error("Update password error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.updatePassword = updatePassword;
