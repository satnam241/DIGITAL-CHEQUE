import express from "express";
import { validateGST, calculateGSTAmount } from "../controllers/gstController";

const router = express.Router();

router.post("/validate-gst", validateGST);
router.post("/calculate-gst", calculateGSTAmount);

export default router;
