"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.printingPage = exports.adminLogin = exports.userLogin = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../model/user.model"));
const emailService_1 = require("../services/emailService");
const otpService_1 = require("../services/otpService");
const transaction_model_1 = __importDefault(require("../model/transaction.model")); // ensure this path/name matches your project
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
/** 🔹 Register Controller */
const register = async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;
        console.log("🟢 Registration attempt:", { fullName, email, phone, role });
        if (!fullName || !email || !phone || !password)
            return res.status(400).json({ message: "All fields are required" });
        if (!/^\S+@\S+\.\S+$/.test(email))
            return res.status(400).json({ message: "Invalid email format" });
        if (!/^[0-9]{10}$/.test(phone))
            return res.status(400).json({ message: "Phone number must be 10 digits" });
        // 🔹 Existing user check
        const existingUser = await user_model_1.default.findOne({ email });
        // Case 1️⃣: Already registered but no password (came from payment flow)
        if (existingUser && !existingUser.password) {
            existingUser.password = await bcryptjs_1.default.hash(password, 10);
            existingUser.fullName = fullName;
            existingUser.phone = phone;
            await existingUser.save();
            return res.status(200).json({
                message: "Password set successfully. You can now log in.",
            });
        }
        // Case 2️⃣: Already registered
        if (existingUser && existingUser.password) {
            return res
                .status(400)
                .json({ message: "Email or phone already registered" });
        }
        // 🟣 CASE: Admin Registration (NO restrictions)
        if (role === "admin") {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const adminUser = new user_model_1.default({
                fullName,
                email,
                phone,
                password: hashedPassword,
                role: "admin",
                session: "active", // ensure active status for admin
            });
            await adminUser.save();
            console.log("✅ Admin registered successfully:", adminUser.email);
            return res.status(201).json({
                message: "Admin registered successfully",
                user: {
                    id: adminUser._id,
                    name: adminUser.fullName,
                    email: adminUser.email,
                    role: adminUser.role,
                },
            });
        }
        // 🟠 CASE: Normal user registration (with Razorpay plan validation)
        const validTransaction = await transaction_model_1.default.findOne({
            "userDetails.email": email,
            status: { $in: ["SUCCESS", "PAID", "COMPLETED"] },
        });
        if (!validTransaction) {
            return res.status(403).json({
                message: "Signup restricted: This email has not purchased a plan. Please buy a plan first using this email.",
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new user_model_1.default({
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: "user",
            companyName: validTransaction.userDetails.companyName || null,
            gstNo: validTransaction.userDetails.gstNo || null,
            address: validTransaction.userDetails.address || null,
            city: validTransaction.userDetails.city || null,
            state: validTransaction.userDetails.state || null,
            plan: validTransaction.planId,
            session: "active", // default active after purchase
            planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // optional 30-day expiry
        });
        await newUser.save();
        console.log("✅ User registered successfully:", newUser.email);
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        console.error("❌ Registration error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.register = register;
/* ==================== COMMON LOGIN ==================== */
const handleLogin = async (req, res, expectedRole) => {
    try {
        const { email, password } = req.body;
        console.log("🟡 [LOGIN ATTEMPT] Payload:", { email, password });
        // ---------------- Validation ----------------
        if (!email || !password) {
            console.log("🔴 Missing email or password");
            return res.status(400).json({ message: "Email and password are required" });
        }
        // ---------------- Find User ----------------
        const user = await user_model_1.default.findOne({ email }).populate("plan");
        console.log("🟢 [USER FOUND?]", !!user);
        if (!user) {
            console.log("🔴 No user found with this email");
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (!user.password) {
            console.log("🔴 Password not set for this user");
            return res.status(401).json({ message: "Password not set for this user" });
        }
        // ---------------- Password Compare ----------------
        console.log("🟣 Comparing passwords...");
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        console.log("🟢 Password match result:", isValid);
        if (!isValid) {
            console.log("🔴 Invalid password");
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // ---------------- Role Validation ----------------
        console.log("🟠 Expected role:", expectedRole, "| Actual role:", user.role);
        if (expectedRole === "admin" && user.role !== "admin") {
            console.log("🔴 Role mismatch: admin login attempted by user");
            return res.status(403).json({ message: "This login is only for admins" });
        }
        if (expectedRole === "user" && user.role !== "user") {
            console.log("🔴 Role mismatch: user login attempted by admin");
            return res.status(403).json({ message: "This login is only for users" });
        }
        // ---------------- User Plan Checks ----------------
        if (expectedRole === "user") {
            console.log("🟣 Checking user session & plan status...");
            if (user.session === "inactive") {
                console.log("🔴 Account is inactive");
                return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
            }
            if (!user.plan) {
                console.log("🔴 No plan assigned to this user");
                return res.status(403).json({ message: "You must purchase a plan to access the dashboard." });
            }
            const planObj = user.plan; // populated plan object
            if (planObj.isActive === false) {
                console.log("🔴 Plan is inactive");
                return res.status(403).json({ message: "Your plan is inactive. Please contact support." });
            }
            if (user.planExpiry && user.planExpiry < new Date()) {
                console.log("🔴 Plan expired:", user.planExpiry);
                return res.status(403).json({ message: "Your plan has expired. Please renew." });
            }
        }
        // ---------------- Generate Token ----------------
        console.log("🟢 Generating JWT...");
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: "6h",
        });
        user.currentToken = token;
        await user.save();
        console.log("🟢 Token saved for user:", user.email);
        // ---------------- Send Response ----------------
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 6 * 60 * 60 * 1000,
        });
        console.log("LOGIN SUCCESS for:", user.email);
        return res.status(200).json({
            message: `${expectedRole === "admin" ? "Admin" : "User"} logged in successfully`,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        console.error("🚨 Login error:", error);
        return res.status(500).json({
            message: "Server error during login",
            error: error.message,
        });
    }
};
/* ==================== EXPORTS ==================== */
const userLogin = (req, res) => handleLogin(req, res, "user");
exports.userLogin = userLogin;
const adminLogin = (req, res) => handleLogin(req, res, "admin");
exports.adminLogin = adminLogin;
/** 🖨️ Secure Route Example */
const printingPage = async (req, res) => {
    try {
        const user = req.user; // attached from auth middleware
        res.json({
            message: `Welcome to Printing Page (${user.role})`,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error accessing printing page", error });
    }
};
exports.printingPage = printingPage;
/** 🚪 Logout */
const logout = async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            await user_model_1.default.findByIdAndUpdate(user._id, { currentToken: null });
        }
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Error during logout", error });
    }
};
exports.logout = logout;
/** 🔹 Forgot Password (send OTP) */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "No user found with this email" });
        const otp = (0, otpService_1.generateOTP)(email);
        // Send OTP via email
        await (0, emailService_1.sendEmail)(email, "Your Password Reset OTP", `
        <h2>Password Reset OTP</h2>
        <p>Your OTP for resetting password is:</p>
        <h3>${otp}</h3>
        <p>It will expire in 5 minutes.</p>
      `);
        return res.json({ message: "OTP sent to your email" });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};
exports.forgotPassword = forgotPassword;
/** 🔹 Reset Password using OTP */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const isValidOTP = (0, otpService_1.verifyOTP)(email, otp);
        if (!isValidOTP)
            return res.status(400).json({ message: "Invalid or expired OTP" });
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        return res.json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Error resetting password", error: error.message });
    }
};
exports.resetPassword = resetPassword;
