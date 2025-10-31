// import mongoose, { Document, Schema } from "mongoose";

// export interface IPlan extends Document {
//   name: string;
//   price: number;
//   cheques: number;
//   durationDays: number;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const planSchema = new Schema<IPlan>(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       unique: true, // ✅ Prevent duplicate plan names
//     },
//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     cheques: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//     durationDays: {
//       type: Number,
//       required: true,
//       min: 1,
//       default: 30, // ✅ Default 1 month plan
//     },
//     isActive: {
//       type: Boolean,
//       default: true, // ✅ Allows admin to disable plan instead of deleting
//     },
//   },
//   {
//     timestamps: true, // ✅ Adds createdAt & updatedAt
//   }
// );

// // ✅ Index for faster queries and sorting
// planSchema.index({ price: 1 });
// planSchema.index({ name: 1 });

// export default mongoose.models.Plan || mongoose.model<IPlan>("Plan", planSchema);
// model/plan.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPlan extends Document {
  name: string;
  price: number;
  cheques: number;
  durationDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // ✅ Add these (optional)
  userId?: mongoose.Types.ObjectId | null;
  status?: "active" | "expired" | "inactive";
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    cheques: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1, default: 30 },
    isActive: { type: Boolean, default: true },

    // ✅ Newly added fields
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "expired", "inactive"], default: "inactive" },
  },
  { timestamps: true }
);

planSchema.index({ price: 1 });
planSchema.index({ name: 1 });

export default mongoose.models.Plan || mongoose.model<IPlan>("Plan", planSchema);
