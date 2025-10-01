import express from "express";
import { saveStep2, saveOrderDetails, reviewDetails, finalizeWizard } from "../controllers/wizard.controller";

const router = express.Router();

router.post("/step2", saveStep2);
router.post("/order-details", saveOrderDetails);
router.get("/review", reviewDetails);
router.post("/finalize", finalizeWizard);

export default router;
