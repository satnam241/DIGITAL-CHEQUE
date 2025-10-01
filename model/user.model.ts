import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  fullName: string; // controller में used
  email: string;
  phone: string;
  password?: string; // optional for guest users
  plan?: Types.ObjectId;
  chequeCounter?: number;
  planExpiry?: Date;
  currentToken?: string;
  sessionId?: string;

  // Step2 Address fields
  salutation?: string;
  companyName?: string;
  gstNo?: string;
  address?: string;
  pinCode?: string;
  city?: string;
  state?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true }, // required for guest & registered
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
    password: { type: String, required: false }, // optional for guest

    // Subscription details
    plan: { type: Schema.Types.ObjectId, ref: "Plan" },
    chequeCounter: { type: Number, default: 0 },
    planExpiry: { type: Date },
    currentToken: { type: String, default: null },
    sessionId: { type: String, default: null },

    // Step2 Address details
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
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
