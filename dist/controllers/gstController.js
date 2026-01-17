"use strict";
// import { Request, Response } from "express";
// import { calculateGST } from "../utils/gstCalculator";
// import { validateGSTNumber } from "../utils/gstValidator";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGSTAmount = exports.validateGST = void 0;
const gstCalculator_1 = require("../utils/gstCalculator");
const gstValidator_1 = require("../utils/gstValidator");
// -------- Validate GST Number ----------
const validateGST = async (req, res) => {
    try {
        const { gstNumber, state } = req.body;
        if (!gstNumber) {
            return res.status(400).json({
                success: false,
                error: "GST number is required",
            });
        }
        const validation = (0, gstValidator_1.validateGSTNumber)(gstNumber, state);
        return res.json({
            success: validation.isValid,
            data: {
                isValid: validation.isValid,
                gstNumber,
                state,
            },
            message: validation.message,
        });
    }
    catch (error) {
        console.error("Error validating GST:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to validate GST number",
        });
    }
};
exports.validateGST = validateGST;
const calculateGSTAmount = async (req, res) => {
    try {
        const { price, quantity } = req.body;
        console.log("Received price:", price, "quantity:", quantity);
        if (price === undefined || price === null) {
            return res.status(400).json({ success: false, error: "Price is required" });
        }
        const result = await (0, gstCalculator_1.calculateGST)(price, quantity || 1);
        console.log("GST calculation result:", result);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error || "Failed to calculate GST",
            });
        }
        return res.json({
            success: true,
            data: result.data,
            message: "GST calculated successfully",
        });
    }
    catch (error) {
        console.error("Error calculating GST:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to calculate GST",
        });
    }
};
exports.calculateGSTAmount = calculateGSTAmount;
