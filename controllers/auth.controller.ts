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


export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // Save token in DB → invalidates previous sessions
    user.currentToken = token;
    await user.save();

    // Return token + user info
    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
};