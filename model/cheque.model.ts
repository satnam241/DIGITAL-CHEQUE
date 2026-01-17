import mongoose, { Document, Schema, model } from "mongoose";

// Cheque interface
export interface ICheque extends Document {
  payee: string;
  amount: number;
  amountInWords: string;
  date: Date;
  total: number;
  used: number;
  history: {
    type: [Schema.Types.Mixed],
    default: [],
  },
}

const chequeSchema = new Schema<ICheque>(
  {
    payee: { type: String, required: true },
    amount: { type: Number, required: true },
    amountInWords: { type: String, required: true }, // controller will handle conversion
    date: { type: Date, required: true },
    total: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  history: {
    type: [Schema.Types.Mixed],
    default: [],
  },


  },
  { timestamps: true } // createdAt & updatedAt
);

// Export the model
const Cheque = model<ICheque>("Cheque", chequeSchema);

export default Cheque;
