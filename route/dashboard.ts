import express from "express";
import {authMiddleware} from "../middleware/auth";
import { getUserDetails, updatePassword } from "../controllers/dashboardController";

const router = express.Router();

router.get("/user", authMiddleware, getUserDetails);
router.put("/dashboard/resetpassword", authMiddleware, updatePassword);

export default router;
