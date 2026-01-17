"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/users", auth_1.authMiddleware, admin_controller_1.getAllUsers);
router.put("/user/:userId/toggle", auth_1.authMiddleware, admin_controller_1.toggleUserStatus);
router.put("/plan/:planId/gst", auth_1.authMiddleware, admin_controller_1.updatePlanGST);
router.get("/transactions", auth_1.authMiddleware, admin_controller_1.getAllTransactions);
router.get("/earnings", auth_1.authMiddleware, admin_controller_1.getMonthlyEarnings);
// Create Plan
router.post("/plan", auth_1.authMiddleware, admin_controller_1.createPlan);
router.get("/plan", auth_1.authMiddleware, admin_controller_1.getPlans);
router.put("/plan/:planId", auth_1.authMiddleware, admin_controller_1.updatePlan);
router.delete("/plan/:planId", auth_1.authMiddleware, admin_controller_1.deletePlan);
exports.default = router;
