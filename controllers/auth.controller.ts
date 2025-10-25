import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../model/user.model";
import { sendEmail } from "../services/emailService";
import { generateOTP, verifyOTP } from "../services/otpService";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/** 🔹 Register New User */
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Validation
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 10 digits" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or Phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user", // Prevent unwanted role injection
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};


const handleLogin = async (req: Request, res: Response, expectedRole: "admin" | "user") => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).populate("plan");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 🔹 Allow admin to log in even if inactive or plan not active
  if (user.role === "admin") {
    const isValid = await bcrypt.compare(password, user.password!);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "6h" }
    );

    user.currentToken = token;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Admin logged in successfully",
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  }

  // 🔹 For normal users
  if (user.role !== expectedRole) {
    return res.status(403).json({ message: "This login is only for users" });
  }

  // Check if account is deactivated
  if (user.session === "inactive") {
    return res.status(403).json({ message: "Your account is deactivated. Contact admin." });
  }
  
  const isValid = await bcrypt.compare(password, user.password!);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 🟡 Only users must have active plan
  if (!user.plan || !user.plan.isActive) {
    return res.status(403).json({
      message: "You must purchase a plan to access the dashboard",
    });
  }
  // Only users with plan can login
if (!user.plan || (user.planExpiry && user.planExpiry < new Date())) {
  return res.status(403).json({ message: "Your plan is inactive or expired. Please renew." });
}


  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "6h" }
  );

  user.currentToken = token;
  await user.save();

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

/** 🧑 User Login */
export const userLogin = (req: Request, res: Response) => handleLogin(req, res, "user");

/** 👑 Admin Login */
export const adminLogin = (req: Request, res: Response) => handleLogin(req, res, "admin");

/** 🖨️ Secure Route Example */
export const printingPage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // attached from auth middleware

    res.json({
      message: `Welcome to Printing Page (${user.role})`,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error accessing printing page", error });
  }
};

/** 🚪 Logout */
export const logout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user) {
      await User.findByIdAndUpdate(user._id, { currentToken: null });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error during logout", error });
  }
};

/** 🔹 Forgot Password (send OTP) */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user found with this email" });

    const otp = generateOTP(email);

    // Send OTP via email
    await sendEmail(
      email,
      "Your Password Reset OTP",
      `
        <h2>Password Reset OTP</h2>
        <p>Your OTP for resetting password is:</p>
        <h3>${otp}</h3>
        <p>It will expire in 5 minutes.</p>
      `
    );

    return res.json({ message: "OTP sent to your email" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};

/** 🔹 Reset Password using OTP */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Email, OTP, and new password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValidOTP = verifyOTP(email, otp);
    if (!isValidOTP) return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};



