import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  plan?: mongoose.Types.ObjectId;         // subscribed plan
  chequeCounter?: number;                 // remaining cheques
  planExpiry?: Date;                       // plan expiry date
  currentToken?: string;                  // single session token
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^\S+@\S+\.\S+$/ 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[0-9]{10}$/ 
  },
  password: { type: String, required: true },
  plan: { type: Schema.Types.ObjectId, ref: "Plan" },
  chequeCounter: { type: Number, default: 0 },
  planExpiry: { type: Date },
  currentToken: { type: String },
  sessionId: { type: String, default: null },  // for single session
});

export default mongoose.model<IUser>("User", userSchema);
