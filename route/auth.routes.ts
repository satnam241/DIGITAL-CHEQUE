import { Router } from "express";
import { register, login, logout, printingPage } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/signup", register);
router.post("/login", login);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});
router.get("/cheque-printing", authMiddleware, printingPage);

export default router;
