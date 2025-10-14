import mongoose, { Document, Schema } from "mongoose";

export interface IPlan extends Document {
  name: string;
  price: number;
  cheques: number;
  durationDays: number;
}

const planSchema = new Schema<IPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  cheques: { type: Number, required: true },
  durationDays: { type: Number, required: true },
});

export default mongoose.model<IPlan>("Plan", planSchema);
