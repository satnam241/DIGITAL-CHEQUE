import express from "express";
import {authMiddleware} from "../middleware/auth";
import { getUserDetails, getUsageStats } from "../controllers/dashboardController";

const router = express.Router();

router.get("/me", authMiddleware, getUserDetails);
router.get("/usage/:userId", authMiddleware, getUsageStats);

export default router;
