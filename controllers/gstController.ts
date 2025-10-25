// import { Request, Response } from "express";
// import { calculateGST } from "../utils/gstCalculator";
// import { validateGSTNumber } from "../utils/gstValidator";

// // -------- Validate GST Number ----------
// export const validateGST = async (req: Request, res: Response) => {
//   try {
//     const { gstNumber, state } = req.body;

//     if (!gstNumber) {
//       return res.status(400).json({
//         success: false,
//         error: "GST number is required",
//       });
//     }

//     const validation = validateGSTNumber(gstNumber, state);

//     return res.json({
//       success: validation.isValid,
//       data: {
//         isValid: validation.isValid,
//         gstNumber,
//         state,
//       },
//       message: validation.message,
//     });
//   } catch (error) {
//     console.error("Error validating GST:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to validate GST number",
//     });
//   }
// };

// // -------- GST Calculation API ----------
// export const calculateGSTAmount = async (req: Request, res: Response) => {
//   try {
//     const { price, quantity } = req.body;

//     if (!price) {
//       return res.status(400).json({ success: false, error: "Price is required" });
//     }

//     const result = calculateGST(price, quantity || 1);

//     return res.json({
//       success: true,
//       data: result,
//       message: "GST calculated successfully",
//     });
//   } catch (error) {
//     console.error("Error calculating GST:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to calculate GST",
//     });
//   }
// };
import { Request, Response } from "express";
import { calculateGST } from "../utils/gstCalculator";
import { validateGSTNumber } from "../utils/gstValidator";

// -------- Validate GST Number ----------
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

export const calculateGSTAmount = async (req: Request, res: Response) => {
  try {
    const { price, quantity } = req.body;
    console.log("Received price:", price, "quantity:", quantity);

    if (price === undefined || price === null) {
      return res.status(400).json({ success: false, error: "Price is required" });
    }

    const result = await calculateGST(price, quantity || 1);
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
  } catch (error) {
    console.error("Error calculating GST:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to calculate GST",
    });
  }
};
