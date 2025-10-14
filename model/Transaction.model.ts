import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId?: mongoose.Schema.Types.ObjectId | null;
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
    companyName?: string | null;
    gstNo?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
  };
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: { type: String, default: "PENDING" },
    orderId: { type: String, required: true },
    paymentId: { type: String, default: null },
    signature: { type: String, default: null },
    userDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      companyName: { type: String, default: null },
      gstNo: { type: String, default: null },
      address: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// ✅ Ye line error fix karegi:
export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);