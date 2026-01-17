"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.get("/user", auth_1.authMiddleware, dashboardController_1.getUserDetails);
router.put("/dashboard/resetpassword", auth_1.authMiddleware, dashboardController_1.updatePassword);
router.put("/logout", auth_1.authMiddleware, auth_controller_1.logout);
exports.default = router;
