const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User recipient is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["contract_event", "dispute_event", "system_event", "payment_event"],
      default: "contract_event",
    },
    relatedContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    relatedDispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dispute",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
