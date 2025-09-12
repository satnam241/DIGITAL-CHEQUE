import { Router } from "express";
import { createCheque, getCheques, getChequeById } from "../controllers/cheque.controller";

const router = Router();

// Create cheque
router.post("/create", createCheque);

// Get all cheques
router.get("/get-cheque", getCheques);

// Get single cheque by ID
router.get("/get-cheque/:id", getChequeById);

export default router;
