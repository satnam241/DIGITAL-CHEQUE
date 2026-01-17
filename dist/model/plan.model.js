"use strict";
// import mongoose, { Document, Schema } from "mongoose";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
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
const mongoose_1 = __importStar(require("mongoose"));
const planSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    cheques: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1, default: 30 },
    isActive: { type: Boolean, default: true },
    // ✅ Newly added fields
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "expired", "inactive"], default: "inactive" },
}, { timestamps: true });
planSchema.index({ price: 1 });
planSchema.index({ name: 1 });
exports.default = mongoose_1.default.models.Plan || mongoose_1.default.model("Plan", planSchema);
