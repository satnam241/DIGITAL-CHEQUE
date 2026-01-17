"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 🔹 Public Routes
router.post("/signup", auth_controller_1.register); // Register User (role = user/admin via body)
router.post("/login/user", auth_controller_1.userLogin); // User Login
router.post("/login/admin", auth_controller_1.adminLogin); // Admin Login
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/reset-password", auth_controller_1.resetPassword);
// 🔹 Protected Routes
router.post("/logout", auth_1.authMiddleware, auth_controller_1.logout);
router.get("/me", auth_1.authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
// 🖨️ Example Protected Page
router.get("/cheque-printing", auth_1.authMiddleware, auth_controller_1.printingPage);
exports.default = router;
