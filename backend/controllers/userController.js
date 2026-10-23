const User = require("../models/User");

// @desc    Get the logged-in user's own profile
// @route   GET /api/users/me
// @access  Private (any logged-in user)
const getMyProfile = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching profile", error: error.message });
  }
};

// @desc    Update the logged-in user's own profile
// @route   PUT /api/users/me
// @access  Private (any logged-in user)
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, address, farmDetails, businessName } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (user.role === "farmer" && farmDetails) {
      const existingFarmDetails = user.farmDetails && typeof user.farmDetails.toObject === "function"
        ? user.farmDetails.toObject()
        : (user.farmDetails || {});

      user.farmDetails = {
        ...existingFarmDetails,
        ...farmDetails,
      };
      user.markModified("farmDetails");
    }
    if (user.role === "buyer" && businessName !== undefined) {
      user.businessName = businessName;
    }

    await user.save();
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating profile", error: error.message });
  }
};

// @desc    Upload profile picture
// @route   PUT /api/users/me/profile-picture
// @access  Private (any logged-in user)
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imagePath },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Profile picture uploaded successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error uploading profile picture", error: error.message });
  }
};

// @desc    Upload farm photo (Farmer only)
// @route   POST /api/users/me/farm-photos
// @access  Private (farmer only)
const uploadFarmPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can upload farm photos" });
    }

    if (!user.farmDetails) {
      user.farmDetails = {};
    }
    if (!user.farmDetails.farmPhotos) {
      user.farmDetails.farmPhotos = [];
    }

    user.farmDetails.farmPhotos.push(imagePath);
    user.markModified("farmDetails");
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({ message: "Farm photo uploaded successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error uploading farm photo", error: error.message });
  }
};

// @desc    Upload business photo (Buyer only)
// @route   POST /api/users/me/business-photos
// @access  Private (buyer only)
const uploadBusinessPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can upload business photos" });
    }

    if (!user.businessPhotos) {
      user.businessPhotos = [];
    }

    user.businessPhotos.push(imagePath);
    user.markModified("businessPhotos");
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({ message: "Business photo uploaded successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error uploading business photo", error: error.message });
  }
};

// @desc    Get active farmers for buyer contract selection
// @route   GET /api/users/farmers
// @access  Private (authenticated users: buyer, farmer, admin)
const getActiveFarmers = async (req, res) => {
  try {
    const { search, location, crop } = req.query;
    let conditions = [{ role: "farmer", isActive: true }];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      conditions.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { address: searchRegex },
          { "farmDetails.cropsGrown": searchRegex },
          { "farmDetails.location": searchRegex },
        ],
      });
    }

    if (location) {
      const locRegex = new RegExp(location, "i");
      conditions.push({
        $or: [
          { address: locRegex },
          { "farmDetails.location": locRegex },
        ],
      });
    }

    if (crop) {
      const cropRegex = new RegExp(crop, "i");
      conditions.push({
        $or: [
          { "farmDetails.cropsGrown": cropRegex },
          { "farmDetails.crops": cropRegex },
        ],
      });
    }

    const queryFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const farmers = await User.find(queryFilter)
      .select("-password")
      .sort({ name: 1 });

    return res.status(200).json({ count: farmers.length, farmers });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching farmers", error: error.message });
  }
};

// @desc    Get all users (farmers and buyers)
// @route   GET /api/users
// @access  Private (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching users", error: error.message });
  }
};

// @desc    Activate or deactivate a user
// @route   PUT /api/users/:id/status
// @access  Private (admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User status updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating user status", error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin accounts cannot be deleted through this route" });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting user", error: error.message });
  }
};

// @desc    Get users for verification review
// @route   GET /api/users/verification
// @access  Private (admin only)
const getVerificationUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = { role: { $ne: "admin" } };
    if (status && status !== "All") {
      query.verificationStatus = status;
    }
    if (role && role !== "All") {
      query.role = role;
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching verification users", error: error.message });
  }
};

// @desc    Verify or reject a user profile
// @route   PUT /api/users/:id/verification
// @access  Private (admin only)
const updateVerificationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid verification status. Must be Pending, Verified, or Rejected." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: `User verification status updated to ${status}`, user });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating verification status", error: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  uploadFarmPhoto,
  uploadBusinessPhoto,
  getActiveFarmers,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getVerificationUsers,
  updateVerificationStatus,
};
