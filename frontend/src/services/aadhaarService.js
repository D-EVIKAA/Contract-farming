import api from "./api";

// Initiate Aadhaar OTP with mandatory consent
export const sendAadhaarOtp = async ({ aadhaar, consent = true, consentText }) => {
  const { data } = await api.post("/auth/aadhaar/send-otp", {
    aadhaar,
    consent,
    consentText,
  });
  return data;
};

// Verify Aadhaar OTP (Registration / Pre-auth flow)
export const verifyAadhaarOtp = async ({ aadhaar, otp, clientId }) => {
  const { data } = await api.post("/auth/aadhaar/verify-otp", {
    aadhaar,
    otp,
    clientId,
  });
  return data;
};

// Complete Aadhaar Verification for an existing logged-in user profile
export const completeProfileAadhaarVerification = async ({ aadhaar, otp, clientId, consent = true }) => {
  const { data } = await api.post("/auth/aadhaar/complete-verification", {
    aadhaar,
    otp,
    clientId,
    consent,
  });
  return data;
};

// Fetch current Aadhaar verification status & provider info
export const getAadhaarStatus = async () => {
  const { data } = await api.get("/auth/aadhaar/status");
  return data;
};
