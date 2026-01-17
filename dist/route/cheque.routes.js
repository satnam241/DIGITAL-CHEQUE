"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cheque_controller_1 = require("../controllers/cheque.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create cheque
router.post("/create", auth_1.authMiddleware, cheque_controller_1.createCheque);
// Get all cheques
router.get("/get-cheque", auth_1.authMiddleware, cheque_controller_1.getCheques);
// Get single cheque by ID
router.get("/get-cheque/:id", auth_1.authMiddleware, cheque_controller_1.getChequeById);
exports.default = router;
