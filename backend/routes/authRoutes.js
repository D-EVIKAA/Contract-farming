const express = require("express");
const {
  registerUser,
  loginUser,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  completeProfileAadhaarVerification,
  getAadhaarConfigStatus,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/auth/aadhaar/status
router.get("/aadhaar/status", protect, getAadhaarConfigStatus);

// @route   POST /api/auth/aadhaar/send-otp
router.post("/aadhaar/send-otp", sendAadhaarOtp);

// @route   POST /api/auth/aadhaar/verify-otp
router.post("/aadhaar/verify-otp", verifyAadhaarOtp);

// @route   POST /api/auth/aadhaar/complete-verification
router.post("/aadhaar/complete-verification", protect, completeProfileAadhaarVerification);

// @route   POST /api/auth/register
router.post("/register", registerUser);

// @route   POST /api/auth/login
router.post("/login", loginUser);

module.exports = router;
