import { Router } from "express";
import {
  register,
  userLogin,
  adminLogin,
  logout,
  printingPage,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// 🔹 Public Routes
router.post("/signup", register);          // Register User (role = user/admin via body)
router.post("/login/user", userLogin);     // User Login
router.post("/login/admin", adminLogin);   // Admin Login

// 🔹 Protected Routes
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});

// 🖨️ Example Protected Page
router.get("/cheque-printing", authMiddleware, printingPage);

export default router;
