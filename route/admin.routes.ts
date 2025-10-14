import express from "express";
import {
  getAllUsers,
  toggleUserStatus,
  updatePlanGST,
  getAllTransactions,
  getMonthlyEarnings,
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/users", authMiddleware, getAllUsers);
router.put("/user/:userId/toggle", authMiddleware, toggleUserStatus);

router.put("/plan/:planId/gst", authMiddleware, updatePlanGST);
router.get("/transactions", authMiddleware, getAllTransactions);
router.get("/earnings", authMiddleware, getMonthlyEarnings);
// Create Plan
router.post("/plan", authMiddleware, createPlan);
router.get("/plan", authMiddleware, getPlans);
router.put("/plan/:planId", authMiddleware, updatePlan);
router.delete("/plan/:planId", authMiddleware, deletePlan);

export default router;
