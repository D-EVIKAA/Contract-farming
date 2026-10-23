const express = require("express");
const { getSystemStats } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin analytics dashboard statistics
router.get("/stats", protect, authorizeRoles("admin"), getSystemStats);

module.exports = router;
