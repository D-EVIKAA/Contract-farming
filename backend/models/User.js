const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    // Only relevant when role === "farmer"
    farmDetails: {
      farmSize: { type: String, default: "" },
      soilType: { type: String, default: "" },
      cropsGrown: { type: String, default: "" },
      location: { type: String, default: "" },
      farmPhotos: [{ type: String }],
    },
    // Only relevant when role === "buyer"
    businessName: {
      type: String,
      trim: true,
      default: "",
    },
    businessPhotos: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true, // used by admin to block/unblock users
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    // Aadhaar Identity Verification Module (Demo/Sandbox)
    aadhaarVerified: {
      type: Boolean,
      default: false,
    },
    aadhaarLast4: {
      type: String,
      default: null,
    },
    aadhaarHash: {
      type: String,
      default: null,
      select: false, // Never return full hash in default queries
    },
    aadhaarVerificationDetails: {
      status: {
        type: String,
        enum: ["Unverified", "Pending", "Verified", "Failed", "Expired", "Cancelled"],
        default: "Unverified",
      },
      provider: { type: String, default: null }, // e.g. "Surepass", "Cashfree", "Sandbox"
      referenceId: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedName: { type: String, default: null },
      failureReason: { type: String, default: null },
      isSandbox: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", userSchema);
