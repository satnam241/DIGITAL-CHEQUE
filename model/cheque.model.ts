import mongoose, { Document, Schema, model } from "mongoose";

// Cheque interface
export interface ICheque extends Document {
  payee: string;
  amount: number;
  amountInWords: string;
  date: Date;
}

const chequeSchema = new Schema<ICheque>(
  {
    payee: { type: String, required: true },
    amount: { type: Number, required: true },
    amountInWords: { type: String, required: true }, // controller will handle conversion
    date: { type: Date, required: true },
  },
  { timestamps: true } // createdAt & updatedAt
);

// Export the model
const Cheque = model<ICheque>("Cheque", chequeSchema);

export default Cheque;
