"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeWizard = exports.reviewDetails = exports.saveOrderDetails = exports.saveStep2 = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const transaction_model_1 = __importDefault(require("../model/transaction.model"));
const plan_model_1 = __importDefault(require("../model/plan.model"));
// ---------------- Save Step2 (Address + Company Details) ----------------
const saveStep2 = async (req, res) => {
    try {
        const { salutation, fullName, email, phone, companyName, gstNo, address, pinCode, city, state, planId, // frontend optional
         } = req.body;
        // 1️⃣ Find user by email or create new
        let user = await user_model_1.default.findOne({ email });
        if (!user) {
            user = new user_model_1.default({ fullName, email, phone });
        }
        // 2️⃣ Update basic details
        user.salutation = salutation;
        user.fullName = fullName;
        user.phone = phone;
        user.companyName = companyName;
        user.gstNo = gstNo;
        user.address = address;
        user.pinCode = pinCode;
        user.city = city;
        user.state = state;
        // 3️⃣ Assign plan
        let plan;
        if (planId) {
            plan = await plan_model_1.default.findById(planId);
        }
        if (!plan) {
            // agar planId missing ya invalid hai → assign default plan
            plan = await plan_model_1.default.findOne({ isDefault: true });
            // Note: Plan model me isDefault: boolean field hona chahiye
        }
        if (!plan)
            return res.status(400).json({ message: "No plan available" });
        user.plan = plan._id;
        await user.save();
        return res.json({ message: "Step 2 saved successfully", user });
    }
    catch (error) {
        console.error("Save Step2 error:", error);
        return res.status(500).json({ message: "Error saving step2", error });
    }
};
exports.saveStep2 = saveStep2;
// ---------------- Save Order Details (Step 3 before payment) ----------------
const saveOrderDetails = async (req, res) => {
    try {
        const { email, planId, quantity, payableAmount } = req.body;
        // guest user find or create
        let user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        user.plan = planId;
        await user.save();
        return res.json({
            message: "Order details saved",
            orderSummary: { planId, quantity, payableAmount },
        });
    }
    catch (error) {
        console.error("Save order details error:", error);
        return res.status(500).json({ message: "Error saving order details", error });
    }
};
exports.saveOrderDetails = saveOrderDetails;
// ---------------- Review Step ----------------
const reviewDetails = async (req, res) => {
    try {
        const { email } = req.query; // guest email
        if (!email)
            return res.status(400).json({ message: "Email required" });
        const user = await user_model_1.default.findOne({ email }).populate("plan");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({ message: "Review fetched", user });
    }
    catch (error) {
        console.error("Review details error:", error);
        return res.status(500).json({ message: "Error fetching review details", error });
    }
};
exports.reviewDetails = reviewDetails;
// ---------------- Finalize after Payment ----------------
const finalizeWizard = async (req, res) => {
    try {
        const { email, transactionId } = req.body;
        const transaction = await transaction_model_1.default.findById(transactionId);
        if (!transaction)
            return res.status(404).json({ message: "Transaction not found" });
        if (transaction.status !== "SUCCESS") {
            return res.status(400).json({ message: "Payment not successful" });
        }
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const planDurationDays = 30; // TODO: get from Plan model
        user.planExpiry = new Date(Date.now() + planDurationDays * 24 * 60 * 60 * 1000);
        await user.save();
        return res.json({ message: "Wizard completed successfully", user });
    }
    catch (error) {
        console.error("Finalize wizard error:", error);
        return res.status(500).json({ message: "Error finalizing wizard", error });
    }
};
exports.finalizeWizard = finalizeWizard;
