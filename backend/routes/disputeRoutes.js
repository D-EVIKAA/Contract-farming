const express = require("express");
const {
  createDispute,
  getDisputes,
  getDisputeById,
  updateDisputeStatus,
} = require("../controllers/disputeController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createDispute);
router.get("/", getDisputes);
router.get("/:id", getDisputeById);
router.put("/:id/status", authorizeRoles("admin"), updateDisputeStatus);

module.exports = router;
