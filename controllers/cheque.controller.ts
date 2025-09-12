import { Request, Response } from "express";
import Cheque from "../model/cheque.model";
import { toWords } from "number-to-words";  

// -------- Create Cheque --------
export const createCheque = async (req: Request, res: Response): Promise<void> => {
  try {
    const { payee, amount, date } = req.body;

    if (!payee || !amount || !date) {
      res.status(400).json({ message: "Please provide all required fields" });
      return;
    }

    // Convert number -> words
    const amountInWords = toWords(Number(amount)) + " Only";

    const cheque = new Cheque({
      payee,
      amount,
      amountInWords,
      date,
    });

    await cheque.save();

    res.status(201).json({ message: "Cheque created successfully", cheque });
  } catch (error) {
    console.error("Error creating cheque:", error);
    res.status(500).json({ message: "Error creating cheque", error });
  }
};

// -------- Get All Cheques --------
export const getCheques = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cheques = await Cheque.find();
    res.status(200).json(cheques);
  } catch (error) {
    console.error("Error fetching cheques:", error);
    res.status(500).json({ message: "Error fetching cheques", error });
  }
};

// -------- Get Cheque by ID --------
export const getChequeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const chequeId = req.params.id;

    const isValidId = /^[0-9a-fA-F]{24}$/.test(chequeId); // simple ObjectId check
    if (!isValidId) {
      res.status(400).json({ message: "Invalid Cheque ID" });
      return;
    }

    const cheque = await Cheque.findById(chequeId);
    if (!cheque) {
      res.status(404).json({ message: "Cheque not found" });
      return;
    }

    res.status(200).json(cheque);
  } catch (error) {
    console.error("Error fetching cheque:", error);
    res.status(500).json({ message: "Error fetching cheque", error });
  }
};
