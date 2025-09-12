// routes/gstRoutes.ts
import { Router } from "express";
import { validateGST } from "../controllers/gstController";

const router = Router();

router.post("/validation/gst", validateGST);

export default router;
