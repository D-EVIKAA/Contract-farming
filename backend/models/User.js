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
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", userSchema);
