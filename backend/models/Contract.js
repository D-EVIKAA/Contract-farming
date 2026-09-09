const mongoose = require("mongoose");

// A single progress update logged by the farmer for a contract
const progressUpdateSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: [true, "Progress note is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer is required"],
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Farmer is required"],
    },
    cropName: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      default: "kg",
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Price per unit is required"],
      min: [1, "Price per unit must be greater than 0"],
    },
    totalAmount: {
      type: Number, // calculated as quantity * pricePerUnit before saving
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, "Expected delivery date is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    additionalRequirements: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "In Progress",
        "Ready for Delivery",
        "Dispatched",
        "Delivered",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
    progressUpdates: [progressUpdateSchema],
    paymentStatus: {
      type: String,
      enum: ["Pending", "Initiated", "Confirmed", "Paid"],
      default: "Pending",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Automatically calculate totalAmount before saving a contract
contractSchema.pre("save", function (next) {
  this.totalAmount = this.quantity * this.pricePerUnit;
  next();
});

module.exports = mongoose.model("Contract", contractSchema);
