// Simple in-memory OTP store: email -> OTP
const otpStore = new Map<string, { otp: string; expires: number }>();

// Generate 5-digit numeric OTP
export const generateOTP = (email: string): string => {
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
  otpStore.set(email, { otp, expires });
  return otp;
};

export const verifyOTP = (email: string, otp: string): boolean => {
  const record = otpStore.get(email);
  if (!record) return false;
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
