import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import User  from "../model/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    
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
      name,
      email,
      phone,
      password: hashedPassword,
    });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials (no user)" });
    }

    console.log("Entered Password:", password);
    console.log("Stored Hash:", user.password);

    const isValid = await bcrypt.compare(password, user.password);
    console.log("Compare result:", isValid);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials (password mismatch)" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    user.currentToken = token;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600 * 1000,
    });

    return res.status(200).json({ message: "Logged in successfully", user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};


export const printingPage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // middleware se attach hoga

    res.json({
      message: "Welcome to Printing Page (Secure Route)",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error accessing printing page", error });
  }
};export const logout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user) {
      user.currentToken = null;
      await user.save();
    }

    // Clear cookie
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
