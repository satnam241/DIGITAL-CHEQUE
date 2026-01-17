"use strict";
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
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    fullName: { type: String, required: false },
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
    plan: { type: mongoose_1.Schema.Types.ObjectId, ref: "Plan", default: null },
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
    session: {
        type: String,
        enum: ["free", "active", "inactive",],
        default: "free",
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", UserSchema);
