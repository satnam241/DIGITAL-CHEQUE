import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../model/user.model";

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

/** 🔹 Common Login Function */
const handleLogin = async (req: Request, res: Response, expectedRole: "admin" | "user") => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.role !== expectedRole) {
    return res.status(403).json({ message: `This login is only for ${expectedRole}s` });
  }

  const isValid = await bcrypt.compare(password, user.password!);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
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
    message: `${expectedRole} logged in successfully`,
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
export const userLogin = (req: Request, res: Response) => {
  return handleLogin(req, res, "user");
};

/** 👑 Admin Login */
export const adminLogin = (req: Request, res: Response) => {
  return handleLogin(req, res, "admin");
};

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
