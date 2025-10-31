import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId?: mongoose.Schema.Types.ObjectId | null;
  planId: mongoose.Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true, // ✅ faster lookup for dashboard/user history
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
      index: true, // ✅ faster populate & filter by plan
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"], // ✅ enum restriction
      default: "PENDING",
    },
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

// ✅ Index for better sorting on dashboard
transactionSchema.index({ createdAt: -1 });

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);
