const Payment = require("../models/Payment");
const Contract = require("../models/Contract");
const {
  getGatewayConfig,
  createPaymentOrder,
  verifyPaymentAndCapture,
  recordPaymentFailure,
  handleGatewayWebhook,
} = require("../services/paymentService");

// @desc    Buyer creates a payment gateway order for a contract
// @route   POST /api/payments/create-order
// @access  Private (Buyer only)
const createOrder = async (req, res) => {
  try {
    const { contractId } = req.body;
    if (!contractId) {
      return res.status(400).json({ message: "contractId is required to create a payment order." });
    }

    const orderData = await createPaymentOrder({ contractId, user: req.user });
    return res.status(201).json(orderData);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to create payment order." });
  }
};

// @desc    Buyer verifies payment with gateway signature
// @route   POST /api/payments/verify
// @access  Private (Buyer only)
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, paymentMethod, vpa } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ message: "orderId and paymentId are required." });
    }

    const result = await verifyPaymentAndCapture({
      orderId,
      paymentId,
      signature,
      paymentMethod,
      vpa,
      user: req.user,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Payment verification failed." });
  }
};

// @desc    Buyer reports payment failure or modal dismissal
// @route   POST /api/payments/failure
// @access  Private (Buyer only)
const reportFailure = async (req, res) => {
  try {
    const { orderId, failureReason, paymentId } = req.body;
    const payment = await recordPaymentFailure({ orderId, failureReason, paymentId });
    return res.status(200).json({ success: true, payment });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// @desc    Get payment history (Role-based access: Buyer, Farmer, Admin)
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === "buyer") {
      query.buyer = req.user._id;
    } else if (role === "farmer") {
      query.farmer = req.user._id;
    }
    // Admin sees all

    const { status, search } = req.query;
    if (status && status !== "All") {
      query.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { orderId: new RegExp(q, "i") },
        { paymentId: new RegExp(q, "i") },
      ];
    }

    const payments = await Payment.find(query)
      .populate("contract", "cropName quantity unit totalAmount status paymentStatus")
      .populate("buyer", "name email phone businessName")
      .populate("farmer", "name email phone farmDetails")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: payments.length,
      payments,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch payment history", error: err.message });
  }
};

// @desc    Get payments for a specific contract
// @route   GET /api/payments/contract/:contractId
// @access  Private
const getContractPayments = async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId);

    if (!contract) {
      return res.status(404).json({ message: "Contract not found." });
    }

    // Role check
    const isBuyer = req.user.role === "buyer" && contract.buyer.toString() === req.user._id.toString();
    const isFarmer = req.user.role === "farmer" && contract.farmer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to view payments for this contract." });
    }

    const payments = await Payment.find({ contract: contractId })
      .populate("buyer", "name email")
      .populate("farmer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: payments.length, payments });
  } catch (err) {
    return res.status(500).json({ message: "Server error fetching contract payments.", error: err.message });
  }
};

// @desc    Webhook receiver for server-to-server gateway events
// @route   POST /api/payments/webhook
// @access  Public (Validated with x-razorpay-signature)
const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ message: "Missing x-razorpay-signature header." });
    }

    const rawBody = req.body; // Needs raw or Buffer
    const result = await handleGatewayWebhook(rawBody, signature);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// @desc    Get payment gateway status & mode information
// @route   GET /api/payments/config
// @access  Private
const getPaymentConfig = async (req, res) => {
  const config = getGatewayConfig();
  return res.status(200).json({
    mode: config.mode,
    isSandbox: config.isSandbox,
    keyId: config.keyId,
    gateway: "Razorpay",
  });
};

module.exports = {
  createOrder,
  verifyPayment,
  reportFailure,
  getPaymentHistory,
  getContractPayments,
  webhookHandler,
  getPaymentConfig,
};
