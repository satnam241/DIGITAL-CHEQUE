import mongoose, { Document, Schema } from "mongoose";

// -------- Plan Interface --------
export interface IPlan extends Document {
  name: string;        // Plan name, e.g., "Basic", "Standard"
  price: number;       // Plan price, e.g., 49, 129, 499
  cheques: number;     // Number of cheques allowed
  durationDays: number; // Validity duration in days
}

// -------- Plan Schema --------
const planSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  cheques: { type: Number, required: true },
  durationDays: { type: Number, required: true },
});

// -------- Plan Model --------
export default mongoose.model<IPlan>("Plan", planSchema);
