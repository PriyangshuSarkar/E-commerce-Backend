// utils/otpService.ts
import crypto from "crypto";

export const generateOtp = (email: string, password: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(`${email}:${password}`);
  const hashed = hash.digest("hex");
  // Convert hash to a 6-digit number
  const otpCode = parseInt(hashed.slice(0, 6), 16) % 1000000;
  return otpCode.toString().padStart(6, "0"); // Ensure it's 6 digits
};
