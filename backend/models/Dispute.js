const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "Contract ID is required"],
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID who raised the dispute is required"],
    },
    title: {
      type: String,
      required: [true, "Dispute title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Dispute description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Open", "Under Review", "Resolved", "Rejected"],
      default: "Open",
    },
    resolutionDetails: {
      type: String,
      trim: true,
      default: "",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dispute", disputeSchema);
