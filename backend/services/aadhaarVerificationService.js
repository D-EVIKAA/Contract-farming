const crypto = require("crypto");
const { hashAadhaar, isValidAadhaarFormat } = require("../utils/aadhaarUtils");

/**
 * Aadhaar Verification Service
 * Supports authorized providers (Surepass / Cashfree / Custom UIDAI-compatible ecosystem)
 * and an isolated, clearly-labeled Sandbox/Development Mode.
 *
 * Data Minimization Compliance:
 * - Full 12-digit Aadhaar numbers are never persisted to MongoDB.
 * - OTPs are never stored or persisted.
 * - Only HMAC-SHA256 hash and masked last-4 digits are retained.
 */

// In-memory verification sessions store with TTL and attempt limits
// Key: clientId / referenceId -> Session data
const verificationSessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes expiry
const MAX_OTP_ATTEMPTS = 3;

// Periodic cleanup of expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of verificationSessions.entries()) {
    if (now > session.expiresAt) {
      verificationSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Helper: Determine current active provider & mode
const getProviderConfig = () => {
  const mode = (process.env.AADHAAR_PROVIDER_MODE || "sandbox").toLowerCase();
  const provider = (process.env.AADHAAR_PROVIDER || "SUREPASS").toUpperCase();

  const isProductionMode = mode === "production";
  const surepassToken = process.env.SUREPASS_TOKEN;
  const cashfreeId = process.env.CASHFREE_CLIENT_ID;
  const cashfreeSecret = process.env.CASHFREE_CLIENT_SECRET;

  const hasCredentials =
    (provider === "SUREPASS" && !!surepassToken && surepassToken !== "your_surepass_token_here") ||
    (provider === "CASHFREE" && !!cashfreeId && !!cashfreeSecret && cashfreeId !== "your_cashfree_client_id");

  const activeMode = isProductionMode && hasCredentials ? "production" : "sandbox";

  return {
    mode: activeMode,
    isSandbox: activeMode === "sandbox",
    provider: activeMode === "sandbox" ? "SANDBOX" : provider,
    surepassToken,
    surepassBaseUrl: process.env.SUREPASS_BASE_URL || (activeMode === "production" ? "https://kyc-api.surepass.io" : "https://sandbox.surepass.io"),
    cashfreeId,
    cashfreeSecret,
    cashfreeBaseUrl: process.env.CASHFREE_BASE_URL || (activeMode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com"),
  };
};

/**
 * Step 1: Request OTP from Authorized Provider or Sandbox
 * @param {Object} params
 * @param {string} params.aadhaar - 12-digit Aadhaar number
 * @param {boolean} params.consent - User explicit consent
 * @param {string} params.consentText - Text agreed by user
 */
const initiateAadhaarOtp = async ({ aadhaar, consent, consentText }) => {
  if (!consent) {
    throw new Error("Explicit user consent is mandatory for Aadhaar identity verification under UIDAI regulations.");
  }

  const clean = String(aadhaar || "").trim().replace(/\D/g, "");
  if (!isValidAadhaarFormat(clean)) {
    throw new Error("Invalid Aadhaar number format. Must be exactly 12 digits.");
  }

  const config = getProviderConfig();
  const aadhaarHashVal = hashAadhaar(clean);
  const last4 = clean.slice(-4);
  const clientId = `aadhaar_req_${crypto.randomBytes(8).toString("hex")}_${Date.now()}`;

  // PRODUCTION MODE: Call Authorized Provider API
  if (config.mode === "production") {
    if (config.provider === "SUREPASS") {
      try {
        const response = await fetch(`${config.surepassBaseUrl}/api/v1/aadhaar-v2/generate-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.surepassToken}`,
          },
          body: JSON.stringify({
            id_number: clean,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to initiate Aadhaar OTP via verification provider.");
        }

        const providerClientId = data.data?.client_id || clientId;

        // Store session
        verificationSessions.set(providerClientId, {
          clientId: providerClientId,
          aadhaarHash: aadhaarHashVal,
          last4,
          provider: "Surepass",
          isSandbox: false,
          attempts: 0,
          status: "Pending",
          createdAt: Date.now(),
          expiresAt: Date.now() + SESSION_TTL_MS,
        });

        return {
          success: true,
          status: "Pending",
          clientId: providerClientId,
          isSandbox: false,
          provider: "Surepass",
          maskedAadhaar: `XXXX-XXXX-${last4}`,
          message: "Aadhaar OTP dispatched by UIDAI to your mobile number registered with Aadhaar.",
          expiresInSeconds: 600,
        };
      } catch (err) {
        throw new Error(`Provider connection failed: ${err.message}`);
      }
    } else if (config.provider === "CASHFREE") {
      try {
        const response = await fetch(`${config.cashfreeBaseUrl}/verification/offline-aadhaar/otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": config.cashfreeId,
            "x-client-secret": config.cashfreeSecret,
          },
          body: JSON.stringify({
            aadhaar_number: clean,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== "SUCCESS") {
          throw new Error(data.message || "Failed to initiate Aadhaar OTP via Cashfree.");
        }

        const refId = String(data.ref_id);

        verificationSessions.set(refId, {
          clientId: refId,
          aadhaarHash: aadhaarHashVal,
          last4,
          provider: "Cashfree",
          isSandbox: false,
          attempts: 0,
          status: "Pending",
          createdAt: Date.now(),
          expiresAt: Date.now() + SESSION_TTL_MS,
        });

        return {
          success: true,
          status: "Pending",
          clientId: refId,
          isSandbox: false,
          provider: "Cashfree",
          maskedAadhaar: `XXXX-XXXX-${last4}`,
          message: "Aadhaar OTP dispatched to your Aadhaar-linked mobile number.",
          expiresInSeconds: 600,
        };
      } catch (err) {
        throw new Error(`Provider connection failed: ${err.message}`);
      }
    }
  }

  // SANDBOX / DEVELOPMENT MODE (Clearly isolated & labeled)
  verificationSessions.set(clientId, {
    clientId,
    aadhaarHash: aadhaarHashVal,
    last4,
    provider: "Sandbox",
    isSandbox: true,
    attempts: 0,
    status: "Pending",
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return {
    success: true,
    status: "Pending",
    clientId,
    isSandbox: true,
    provider: "Sandbox / Demo",
    maskedAadhaar: `XXXX-XXXX-${last4}`,
    message: "Sandbox test OTP session generated. Use test OTP: 123456.",
    sandboxNotice:
      "DEVELOPMENT / SANDBOX MODE: Real UIDAI verification is inactive. Configure SUREPASS_TOKEN or CASHFREE credentials in .env to enable production verification.",
    expiresInSeconds: 600,
  };
};

/**
 * Step 2: Verify OTP via Authorized Provider or Sandbox
 * @param {Object} params
 * @param {string} params.clientId - Session client reference ID
 * @param {string} params.otp - User entered OTP code
 * @param {string} [params.aadhaar] - Optional Aadhaar for hash verification
 */
const verifyAadhaarOtpCode = async ({ clientId, otp, aadhaar }) => {
  if (!clientId) {
    throw new Error("Verification session reference ID (clientId) is required.");
  }

  const cleanOtp = String(otp || "").trim();
  if (!cleanOtp || cleanOtp.length < 4) {
    throw new Error("Please enter a valid OTP code.");
  }

  const session = verificationSessions.get(clientId);
  if (!session) {
    throw new Error("Verification session expired or not found. Please request a new OTP.");
  }

  if (Date.now() > session.expiresAt) {
    verificationSessions.delete(clientId);
    throw new Error("Aadhaar OTP has expired (10-minute limit exceeded). Please request a new OTP.");
  }

  if (session.attempts >= MAX_OTP_ATTEMPTS) {
    verificationSessions.delete(clientId);
    throw new Error("Maximum verification attempts (3) exceeded for this OTP. Please generate a new OTP.");
  }

  session.attempts += 1;

  const config = getProviderConfig();

  // PRODUCTION MODE VERIFICATION
  if (config.mode === "production" && !session.isSandbox) {
    if (session.provider === "Surepass") {
      try {
        const response = await fetch(`${config.surepassBaseUrl}/api/v1/aadhaar-v2/submit-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.surepassToken}`,
          },
          body: JSON.stringify({
            client_id: clientId,
            otp: cleanOtp,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Aadhaar OTP verification failed with provider.");
        }

        const providerData = data.data || {};
        const verifiedName = providerData.full_name || providerData.name || null;

        // Session verified: remove ephemeral OTP session
        verificationSessions.delete(clientId);

        return {
          success: true,
          status: "Verified",
          aadhaarVerified: true,
          aadhaarLast4: session.last4,
          aadhaarHash: session.aadhaarHash,
          provider: "Surepass",
          referenceId: clientId,
          verifiedName,
          isSandbox: false,
          verifiedAt: new Date(),
          message: "Aadhaar identity verified successfully via Authorized Provider.",
        };
      } catch (err) {
        throw new Error(`Provider verification error: ${err.message}`);
      }
    } else if (session.provider === "Cashfree") {
      try {
        const response = await fetch(`${config.cashfreeBaseUrl}/verification/offline-aadhaar/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": config.cashfreeId,
            "x-client-secret": config.cashfreeSecret,
          },
          body: JSON.stringify({
            ref_id: clientId,
            otp: cleanOtp,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== "VALID") {
          throw new Error(data.message || "Aadhaar OTP verification failed with Cashfree.");
        }

        verificationSessions.delete(clientId);

        return {
          success: true,
          status: "Verified",
          aadhaarVerified: true,
          aadhaarLast4: session.last4,
          aadhaarHash: session.aadhaarHash,
          provider: "Cashfree",
          referenceId: clientId,
          verifiedName: data.name || null,
          isSandbox: false,
          verifiedAt: new Date(),
          message: "Aadhaar identity verified successfully via Cashfree.",
        };
      } catch (err) {
        throw new Error(`Provider verification error: ${err.message}`);
      }
    }
  }

  // SANDBOX MODE VERIFICATION
  const DEMO_OTP = "123456";
  if (cleanOtp !== DEMO_OTP) {
    throw new Error("Invalid OTP code. In Sandbox Mode, enter test OTP: 123456.");
  }

  // Session verified in sandbox
  verificationSessions.delete(clientId);

  return {
    success: true,
    status: "Verified",
    aadhaarVerified: true,
    aadhaarLast4: session.last4,
    aadhaarHash: session.aadhaarHash,
    provider: "Sandbox",
    referenceId: clientId,
    verifiedName: "Sandbox Verified User",
    isSandbox: true,
    verifiedAt: new Date(),
    message: "Aadhaar verified successfully via Sandbox Simulation Mode.",
    sandboxNotice:
      "SANDBOX VERIFICATION: This account was verified in local sandbox mode. In production, configure official provider credentials.",
  };
};

module.exports = {
  getProviderConfig,
  initiateAadhaarOtp,
  verifyAadhaarOtpCode,
};
