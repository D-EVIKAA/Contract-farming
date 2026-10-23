const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Contract = require("../models/Contract");
const { createNotification } = require("../controllers/notificationController");

/**
 * Payment Service (Razorpay Integration & Secure Gateway Flow)
 *
 * Implements:
 * 1. Order Creation with contract amount in INR (paise * 100)
 * 2. Cryptographic HMAC SHA-256 signature verification
 * 3. UPI Intent, UPI QR, Cards & NetBanking checkout support
 * 4. Webhook event handling with signature verification
 * 5. Tamper-proofing: Contract amount and currency are verified server-side
 * 6. Idempotency & duplicate payment protection
 * 7. Isolated Sandbox Mode when live credentials are not set
 */

const getGatewayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const isConfigured =
    !!keyId &&
    !!keySecret &&
    keyId !== "your_razorpay_key_id" &&
    keySecret !== "your_razorpay_key_secret";

  const isTestKey = keyId && keyId.startsWith("rzp_test_");
  const mode = isConfigured ? (isTestKey ? "test" : "production") : "sandbox";

  return {
    isConfigured,
    mode,
    isSandbox: mode === "sandbox",
    keyId: isConfigured ? keyId : "rzp_sandbox_agricontract_demo",
    keySecret,
    webhookSecret,
  };
};

// Initialize Razorpay client if credentials exist
let razorpayInstance = null;
const getRazorpayClient = () => {
  const config = getGatewayConfig();
  if (config.isConfigured && !razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }
  return razorpayInstance;
};

/**
 * Step 1: Create a Gateway Order for a Contract
 * @param {Object} params
 * @param {string} params.contractId - ID of contract to pay for
 * @param {Object} params.user - Authenticated buyer requesting payment
 */
const createPaymentOrder = async ({ contractId, user }) => {
  const contract = await Contract.findById(contractId)
    .populate("buyer", "name email phone")
    .populate("farmer", "name email phone");

  if (!contract) {
    throw new Error("Contract not found.");
  }

  // Permission check: only owning buyer can initiate payment
  if (contract.buyer._id.toString() !== user._id.toString()) {
    throw new Error("Access denied: You are not the authorized buyer for this contract.");
  }

  // Lifecycle check
  if (["Rejected", "Cancelled"].includes(contract.status)) {
    throw new Error(`Cannot initiate payment for a ${contract.status.toLowerCase()} contract.`);
  }

  if (contract.paymentStatus === "Paid") {
    throw new Error("This contract has already been paid in full.");
  }

  const amountInRupees = contract.totalAmount;
  if (!amountInRupees || amountInRupees <= 0) {
    throw new Error("Invalid contract agreed value. Amount must be greater than zero.");
  }

  const config = getGatewayConfig();
  const receipt = `rcpt_${contract._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;

  // REAL RAZORPAY ORDER (Test or Production)
  if (config.isConfigured) {
    try {
      const rzp = getRazorpayClient();
      const amountInPaise = Math.round(amountInRupees * 100);

      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          contractId: contract._id.toString(),
          cropName: contract.cropName,
          buyerName: user.name,
          farmerId: contract.farmer._id.toString(),
        },
      });

      // Save initial payment record in DB
      const payment = await Payment.create({
        contract: contract._id,
        buyer: user._id,
        farmer: contract.farmer._id,
        orderId: rzpOrder.id,
        amount: amountInRupees,
        currency: "INR",
        status: "Created",
        gateway: "Razorpay",
        receipt,
        gatewayResponse: rzpOrder,
        isSandbox: false,
      });

      return {
        success: true,
        orderId: rzpOrder.id,
        amount: amountInRupees,
        amountInPaise,
        currency: "INR",
        keyId: config.keyId,
        receipt,
        contract: {
          id: contract._id,
          cropName: contract.cropName,
          quantity: contract.quantity,
          unit: contract.unit,
        },
        buyer: {
          name: user.name,
          email: user.email,
          phone: user.phone || "9999999999",
        },
        isSandbox: false,
        gatewayMode: config.mode,
      };
    } catch (err) {
      throw new Error(`Gateway order creation failed: ${err.message}`);
    }
  }

  // SANDBOX / DEMO GATEWAY ORDER
  const sandboxOrderId = `order_sb_${contract._id.toString().slice(-6)}_${Date.now()}`;

  await Payment.create({
    contract: contract._id,
    buyer: user._id,
    farmer: contract.farmer._id,
    orderId: sandboxOrderId,
    amount: amountInRupees,
    currency: "INR",
    status: "Created",
    gateway: "Sandbox",
    receipt,
    isSandbox: true,
  });

  return {
    success: true,
    orderId: sandboxOrderId,
    amount: amountInRupees,
    amountInPaise: Math.round(amountInRupees * 100),
    currency: "INR",
    keyId: config.keyId,
    receipt,
    contract: {
      id: contract._id,
      cropName: contract.cropName,
      quantity: contract.quantity,
      unit: contract.unit,
    },
    buyer: {
      name: user.name,
      email: user.email,
      phone: user.phone || "9999999999",
    },
    isSandbox: true,
    gatewayMode: "sandbox",
    sandboxNotice:
      "SANDBOX PAYMENT GATEWAY: Real payment processing requires RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env. Test checkout simulation is ready.",
  };
};

/**
 * Step 2: Verify Payment Completion (Signature & Server-Side Validation)
 * @param {Object} params
 * @param {string} params.orderId - Razorpay or Sandbox order ID
 * @param {string} params.paymentId - Razorpay or Sandbox payment ID
 * @param {string} params.signature - HMAC SHA-256 signature from client
 * @param {string} params.paymentMethod - upi, card, netbanking, etc.
 * @param {string} [params.vpa] - Optional UPI VPA handle if UPI was used
 * @param {Object} params.user - Authenticated buyer
 */
const verifyPaymentAndCapture = async ({
  orderId,
  paymentId,
  signature,
  paymentMethod,
  vpa,
  user,
}) => {
  if (!orderId || !paymentId) {
    throw new Error("Order ID and Payment ID are required to verify transaction.");
  }

  const payment = await Payment.findOne({ orderId })
    .populate("contract")
    .populate("buyer", "name email phone")
    .populate("farmer", "name email phone");

  if (!payment) {
    throw new Error(`Payment record not found for Order ID: ${orderId}`);
  }

  const contract = payment.contract;
  if (!contract) {
    throw new Error("Associated contract for this payment does not exist.");
  }

  // Idempotency: If already verified, return successful result without re-processing
  if (payment.status === "Successful" && contract.paymentStatus === "Paid") {
    return {
      success: true,
      alreadyProcessed: true,
      message: "Payment has already been verified and recorded.",
      payment,
      contract,
    };
  }

  const config = getGatewayConfig();

  // REAL RAZORPAY SIGNATURE VERIFICATION
  if (config.isConfigured && !payment.isSandbox) {
    if (!signature) {
      throw new Error("Gateway signature is required for production verification.");
    }

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.keySecret)
      .update(payload)
      .digest("hex");

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );

    if (!isMatch) {
      payment.status = "Failed";
      payment.failureReason = "Cryptographic signature verification mismatch.";
      await payment.save();
      throw new Error("Payment signature verification failed. Possible payload tampering detected.");
    }

    // Optional: Double check payment details directly with Razorpay API
    try {
      const rzp = getRazorpayClient();
      const rzpPayment = await rzp.payments.fetch(paymentId);

      if (rzpPayment.status !== "captured" && rzpPayment.status !== "authorized") {
        payment.status = "Failed";
        payment.failureReason = `Payment not captured. Status: ${rzpPayment.status}`;
        await payment.save();
        throw new Error(`Payment was not captured by gateway (Status: ${rzpPayment.status}).`);
      }

      payment.gatewayResponse = rzpPayment;
      payment.paymentMethod = rzpPayment.method || paymentMethod || "upi";
      if (rzpPayment.vpa) {
        payment.upiDetails = { vpa: rzpPayment.vpa };
      }
    } catch (apiErr) {
      // If fetching fails, we still rely on signature verification
      console.warn("Could not fetch remote payment details:", apiErr.message);
    }
  }

  // Update Payment Status in DB
  payment.status = "Successful";
  payment.paymentId = paymentId;
  payment.signature = signature || "sandbox_sig";
  payment.paymentMethod = paymentMethod || payment.paymentMethod || "upi";
  if (vpa) {
    payment.upiDetails = { vpa };
  }
  await payment.save();

  // Update Contract Status
  contract.paymentStatus = "Paid";
  contract.statusHistory.push({
    status: "Payment Completed",
    timestamp: new Date(),
  });
  await contract.save();

  // Trigger In-App Notifications
  await createNotification(
    payment.farmer._id,
    "Payment Received for Contract",
    `Buyer ${payment.buyer.name} completed online payment of ₹${payment.amount.toLocaleString("en-IN")} for ${contract.cropName} (${payment.paymentMethod.toUpperCase()}). Txn ID: ${paymentId}.`,
    "payment_event",
    contract._id
  );

  await createNotification(
    payment.buyer._id,
    "Payment Confirmation",
    `Your payment of ₹${payment.amount.toLocaleString("en-IN")} for contract #${contract._id.toString().slice(-6)} was successful. Txn ID: ${paymentId}.`,
    "payment_event",
    contract._id
  );

  return {
    success: true,
    message: "Payment verified and recorded successfully.",
    payment,
    contract,
  };
};

/**
 * Step 3: Handle Payment Cancellation / Failure
 */
const recordPaymentFailure = async ({ orderId, failureReason, paymentId }) => {
  const payment = await Payment.findOne({ orderId });
  if (!payment) return null;

  payment.status = "Failed";
  payment.failureReason = failureReason || "Payment was cancelled or failed at checkout.";
  if (paymentId) payment.paymentId = paymentId;
  await payment.save();

  return payment;
};

/**
 * Webhook Handler: Process Razorpay server-to-server webhook events
 */
const handleGatewayWebhook = async (rawBody, signature) => {
  const config = getGatewayConfig();
  if (!config.webhookSecret) {
    throw new Error("Razorpay webhook secret not configured in environment variables.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(signature, "utf-8"),
    Buffer.from(expectedSignature, "utf-8")
  );

  if (!isMatch) {
    throw new Error("Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody.toString());

  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const payment = await Payment.findOne({ orderId });
    if (payment && payment.status !== "Successful") {
      payment.status = "Successful";
      payment.paymentId = paymentId;
      payment.paymentMethod = paymentEntity.method || "upi";
      payment.gatewayResponse = paymentEntity;
      await payment.save();

      const contract = await Contract.findById(payment.contract);
      if (contract && contract.paymentStatus !== "Paid") {
        contract.paymentStatus = "Paid";
        contract.statusHistory.push({
          status: "Payment Completed (Webhook)",
          timestamp: new Date(),
        });
        await contract.save();
      }
    }
  } else if (event.event === "payment.failed") {
    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const payment = await Payment.findOne({ orderId });
    if (payment && payment.status !== "Successful") {
      payment.status = "Failed";
      payment.failureReason = paymentEntity.error_description || "Webhook reported payment failure";
      await payment.save();
    }
  }

  return { received: true };
};

module.exports = {
  getGatewayConfig,
  createPaymentOrder,
  verifyPaymentAndCapture,
  recordPaymentFailure,
  handleGatewayWebhook,
};
