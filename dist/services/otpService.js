"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.generateOTP = void 0;
// Simple in-memory OTP store: email -> OTP
const otpStore = new Map();
// Generate 5-digit numeric OTP
const generateOTP = (email) => {
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
    otpStore.set(email, { otp, expires });
    return otp;
};
exports.generateOTP = generateOTP;
const verifyOTP = (email, otp) => {
    const record = otpStore.get(email);
    if (!record)
        return false;
    if (record.expires < Date.now()) {
        otpStore.delete(email);
        return false;
    }
    if (record.otp === otp) {
        otpStore.delete(email);
        return true;
    }
    return false;
};
exports.verifyOTP = verifyOTP;
