"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plan_controller_1 = require("../controllers/plan.controller");
const router = express_1.default.Router();
// Admin routes
router.post("/plan-create", plan_controller_1.createPlan);
router.get("/plan", plan_controller_1.getPlans);
router.put("/plans/:id", plan_controller_1.updatePlan);
router.delete("/plans/:id", plan_controller_1.deletePlan);
// User route
router.post("/plans/subscribe", plan_controller_1.subscribePlan);
exports.default = router;
