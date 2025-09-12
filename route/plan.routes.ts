import express from "express";
import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  subscribePlan,
} from "../controllers/plan.controller";

const router = express.Router();

// Admin routes
router.post("/plan-create", createPlan);
router.get("/plan", getPlans);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// User route
router.post("/plans/subscribe", subscribePlan);

export default router;
