import { Router } from "express";
import { createCheque, getCheques, getChequeById } from "../controllers/cheque.controller";
import {authMiddleware} from "../middleware/auth";
const router = Router();

// Create cheque
router.post("/create", authMiddleware,createCheque);

// Get all cheques
router.get("/get-cheque",authMiddleware, getCheques);

// Get single cheque by ID
router.get("/get-cheque/:id",authMiddleware, getChequeById);

export default router;
