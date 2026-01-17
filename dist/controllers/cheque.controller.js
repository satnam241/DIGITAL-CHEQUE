"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChequeById = exports.getCheques = exports.createCheque = void 0;
const cheque_model_1 = __importDefault(require("../model/cheque.model"));
const number_to_words_1 = require("number-to-words");
// -------- Create Cheque --------
const createCheque = async (req, res) => {
    try {
        const { payee, amount, date } = req.body;
        if (!payee || !amount || !date) {
            res.status(400).json({ message: "Please provide all required fields" });
            return;
        }
        // Convert number -> words
        const amountInWords = (0, number_to_words_1.toWords)(Number(amount)) + " Only";
        const cheque = new cheque_model_1.default({
            payee,
            amount,
            amountInWords,
            date,
        });
        await cheque.save();
        res.status(201).json({ message: "Cheque created successfully", cheque });
    }
    catch (error) {
        console.error("Error creating cheque:", error);
        res.status(500).json({ message: "Error creating cheque", error });
    }
};
exports.createCheque = createCheque;
// -------- Get All Cheques --------
const getCheques = async (_req, res) => {
    try {
        const cheques = await cheque_model_1.default.find();
        res.status(200).json(cheques);
    }
    catch (error) {
        console.error("Error fetching cheques:", error);
        res.status(500).json({ message: "Error fetching cheques", error });
    }
};
exports.getCheques = getCheques;
// -------- Get Cheque by ID --------
const getChequeById = async (req, res) => {
    try {
        const chequeId = req.params.id;
        const isValidId = /^[0-9a-fA-F]{24}$/.test(chequeId); // simple ObjectId check
        if (!isValidId) {
            res.status(400).json({ message: "Invalid Cheque ID" });
            return;
        }
        const cheque = await cheque_model_1.default.findById(chequeId);
        if (!cheque) {
            res.status(404).json({ message: "Cheque not found" });
            return;
        }
        res.status(200).json(cheque);
    }
    catch (error) {
        console.error("Error fetching cheque:", error);
        res.status(500).json({ message: "Error fetching cheque", error });
    }
};
exports.getChequeById = getChequeById;
