// models/Transaction.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId?: mongoose.Schema.Types.ObjectId;   // 👈 optional
  planId: mongoose.Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  userDetails: {
    fullName: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
  };
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false }, // 👈 required hatao
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    orderId: { type: String, required: true },
    paymentId: { type: String },
    signature: { type: String },
    userDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String },
      state: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
