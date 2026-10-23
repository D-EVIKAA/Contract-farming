const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "Contract reference is required"],
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer reference is required"],
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Farmer reference is required"],
      index: true,
    },
    orderId: {
      type: String,
      required: [true, "Gateway Order ID is required"],
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    signature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "Created",
        "Attempted",
        "Pending",
        "Successful",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
      default: "Created",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "upi", // upi, card, netbanking, wallet, sandbox
    },
    upiDetails: {
      vpa: { type: String, default: null },
    },
    gateway: {
      type: String,
      default: "Razorpay",
    },
    receipt: {
      type: String,
      default: null,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    isSandbox: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
