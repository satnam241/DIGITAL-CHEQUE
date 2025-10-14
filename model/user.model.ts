import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password?: string | null;
  role: "admin" | "user";
  plan?: Types.ObjectId | null;
  chequeCounter?: number;
  planExpiry?: Date | null;
  currentToken?: string | null;
  sessionId?: string | null;
  salutation?: string | null;
  companyName?: string | null;
  gstNo?: string | null;
  address?: string | null;
  pinCode?: string | null;
  city?: string | null;
  state?: string | null;
  monthCounter?: number;
  session?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S+$/,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
    },
    password: { type: String, required: false, default: null },

    // Role for access control
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    // Subscription details
    plan: { type: Schema.Types.ObjectId, ref: "Plan", default: null },
    chequeCounter: { type: Number, default: 0 },
    planExpiry: { type: Date, default: null },
    currentToken: { type: String, default: null },
    sessionId: { type: String, default: null },

    salutation: { type: String, default: null },
    companyName: { type: String, default: null },
    gstNo: {
      type: String,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      default: null,
    },
    address: { type: String, default: null },
    pinCode: { type: String, match: /^[0-9]{6}$/, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },

    monthCounter: { type: Number, default: 0 },
    session: { type: String, default: "free" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
