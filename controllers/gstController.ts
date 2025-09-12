// controllers/gstController.ts
import { Request, Response } from "express";
import { validateGSTNumber } from "../utils/gstValidator";

export const validateGST = async (req: Request, res: Response) => {
  try {
    const { gstNumber, state } = req.body;

    if (!gstNumber) {
      return res.status(400).json({
        success: false,
        error: "GST number is required",
      });
    }

    const validation = validateGSTNumber(gstNumber, state);

    return res.json({
      success: validation.isValid,
      data: {
        isValid: validation.isValid,
        gstNumber,
        state,
      },
      message: validation.message,
    });
  } catch (error) {
    console.error("Error validating GST:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to validate GST number",
    });
  }
};
