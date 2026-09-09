const express = require("express");
const {
  createContract,
  getContracts,
  getContractById,
  acceptContract,
  rejectContract,
  addProgress,
  markReady,
  dispatchContract,
  confirmDelivery,
  completeContract,
  initiatePayment,
  confirmPayment,
  cancelContract,
} = require("../controllers/contractController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// All contract routes require authentication
router.use(protect);

// Create, list, get single
router.post("/", authorizeRoles("buyer"), createContract);
router.get("/", getContracts);
router.get("/:id", getContractById);

// Farmer workflow
router.put("/:id/accept", authorizeRoles("farmer"), acceptContract);
router.put("/:id/reject", authorizeRoles("farmer"), rejectContract);
router.put("/:id/progress", authorizeRoles("farmer"), upload.single("image"), addProgress);
router.put("/:id/ready", authorizeRoles("farmer"), markReady);
router.put("/:id/dispatch", authorizeRoles("farmer"), dispatchContract);

// Buyer workflow
router.put("/:id/confirm-delivery", authorizeRoles("buyer"), confirmDelivery);
router.put("/:id/complete", authorizeRoles("buyer"), completeContract);

// Payment workflow: Buyer initiates, Farmer confirms receipt
router.put("/:id/initiate-payment", authorizeRoles("buyer"), initiatePayment);
router.put("/:id/confirm-payment", authorizeRoles("farmer"), confirmPayment);

// Cancel contract (Buyer or Admin)
router.put("/:id/cancel", authorizeRoles("buyer", "admin"), cancelContract);

module.exports = router;
