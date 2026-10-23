const express = require("express");
const {
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
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Logged-in user's own profile & uploads
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.put("/me/profile-picture", protect, upload.single("image"), uploadProfilePicture);
router.post("/me/farm-photos", protect, authorizeRoles("farmer"), upload.single("photo"), uploadFarmPhoto);
router.post("/me/business-photos", protect, authorizeRoles("buyer"), upload.single("photo"), uploadBusinessPhoto);

// Dedicated buyer-accessible active farmer listing endpoint
router.get("/farmers", protect, getActiveFarmers);

// Admin-only routes
router.get("/verification", protect, authorizeRoles("admin"), getVerificationUsers);
router.put("/:id/verification", protect, authorizeRoles("admin"), updateVerificationStatus);
router.get("/", protect, authorizeRoles("admin"), getAllUsers);
router.put("/:id/status", protect, authorizeRoles("admin"), updateUserStatus);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

module.exports = router;
