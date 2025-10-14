import express from "express";
import {authMiddleware} from "../middleware/auth";
import { getUserDetails, updatePassword } from "../controllers/dashboardController";
import { logout } from "../controllers/auth.controller";
const router = express.Router();

router.get("/user", authMiddleware, getUserDetails);
router.put("/dashboard/resetpassword", authMiddleware, updatePassword);
router.put("/logout", authMiddleware, logout);
export default router;
