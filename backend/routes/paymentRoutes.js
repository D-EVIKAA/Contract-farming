const express = require("express");
const {
  createOrder,
  verifyPayment,
  reportFailure,
  getPaymentHistory,
  getContractPayments,
  webhookHandler,
  getPaymentConfig,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Webhook route - public with signature verification (must handle raw payload)
router.post("/webhook", express.raw({ type: "application/json" }), webhookHandler);

// Protected routes below
router.use(protect);

router.get("/config", getPaymentConfig);
router.get("/history", getPaymentHistory);
router.get("/contract/:contractId", getContractPayments);

// Buyer-only transaction routes
router.post("/create-order", authorizeRoles("buyer"), createOrder);
router.post("/verify", authorizeRoles("buyer"), verifyPayment);
router.post("/failure", authorizeRoles("buyer"), reportFailure);

module.exports = router;
