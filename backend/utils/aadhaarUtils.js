const crypto = require("crypto");

// Temporary in-memory store for demo-verified Aadhaar numbers during registration
const verifiedAadhaarStore = new Map();

// Fixed Demo OTP for sandbox flow
const DEMO_OTP = "123456";

// Hash Aadhaar using HMAC-SHA256 for secure one-way identifier matching
const hashAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber) return null;
  const clean = String(aadhaarNumber).trim().replace(/\D/g, "");
  if (clean.length !== 12) return null;
  const secret = process.env.JWT_SECRET || "contract_farming_aadhaar_demo_secret";
  return crypto.createHmac("sha256", secret).update(clean).digest("hex");
};

// Format masked Aadhaar e.g. XXXX-XXXX-1234
const maskAadhaar = (last4) => {
  if (!last4) return "Not Provided";
  return `XXXX-XXXX-${last4}`;
};

// Validate 12-digit numeric Aadhaar string format
const isValidAadhaarFormat = (aadhaarNumber) => {
  if (!aadhaarNumber) return false;
  const clean = String(aadhaarNumber).trim();
  return /^\d{12}$/.test(clean);
};

// Mark Aadhaar as verified in temporary session cache (valid for 15 minutes)
const markAadhaarVerifiedInSession = (aadhaarNumber) => {
  const hash = hashAadhaar(aadhaarNumber);
  if (!hash) return;
  verifiedAadhaarStore.set(hash, {
    verifiedAt: Date.now(),
    last4: String(aadhaarNumber).trim().slice(-4),
  });
};

// Check if Aadhaar was demo-verified in temporary session cache
const isAadhaarVerifiedInSession = (aadhaarNumber) => {
  const hash = hashAadhaar(aadhaarNumber);
  if (!hash) return false;
  const session = verifiedAadhaarStore.get(hash);
  if (!session) return false;
  // 15 minutes expiration
  if (Date.now() - session.verifiedAt > 15 * 60 * 1000) {
    verifiedAadhaarStore.delete(hash);
    return false;
  }
  return true;
};

// Clear session cache entry after account registration completes
const clearAadhaarVerificationSession = (aadhaarNumber) => {
  const hash = hashAadhaar(aadhaarNumber);
  if (hash) {
    verifiedAadhaarStore.delete(hash);
  }
};

module.exports = {
  hashAadhaar,
  maskAadhaar,
  isValidAadhaarFormat,
  DEMO_OTP,
  markAadhaarVerifiedInSession,
  isAadhaarVerifiedInSession,
  clearAadhaarVerificationSession,
};
