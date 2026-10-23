const Contract = require("../models/Contract");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// Statuses where the contract is closed
const CLOSED_STATUSES = ["Rejected", "Cancelled", "Completed"];

// @desc    Buyer creates a new contract with REQUIRED farmerId
// @route   POST /api/contracts
// @access  Private (buyer only)
const createContract = async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers are authorized to initiate/propose a contract request." });
    }

    const {
      farmerId,
      cropName,
      quantity,
      unit,
      pricePerUnit,
      expectedDeliveryDate,
      location,
      additionalRequirements,
    } = req.body;

    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required. Buyer must select a farmer." });
    }

    if (!cropName || !quantity || !pricePerUnit || !expectedDeliveryDate || !location) {
      return res.status(400).json({
        message: "cropName, quantity, pricePerUnit, expectedDeliveryDate and location are required",
      });
    }

    const selectedFarmer = await User.findById(farmerId);
    if (!selectedFarmer) {
      return res.status(404).json({ message: "Selected farmer not found" });
    }

    if (selectedFarmer.role !== "farmer") {
      return res.status(400).json({ message: "Selected user is not a farmer" });
    }

    if (!selectedFarmer.isActive) {
      return res.status(400).json({ message: "Selected farmer account is deactivated" });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    if (Number(pricePerUnit) <= 0) {
      return res.status(400).json({ message: "Price per unit must be a positive number" });
    }

    const deliveryDate = new Date(expectedDeliveryDate);
    if (isNaN(deliveryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expected delivery date" });
    }
    if (deliveryDate < new Date()) {
      return res.status(400).json({ message: "Expected delivery date must be in the future" });
    }

    const contract = await Contract.create({
      buyer: req.user._id,
      farmer: farmerId,
      cropName,
      quantity,
      unit: unit || "kg",
      pricePerUnit,
      expectedDeliveryDate: deliveryDate,
      location,
      additionalRequirements: additionalRequirements || "",
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: new Date() }],
      paymentStatus: "Pending",
    });

    // Trigger Notification for the selected Farmer
    await createNotification(
      farmerId,
      "New Contract Proposal Received",
      `Buyer ${req.user.name} created a new contract proposal for ${cropName} (${quantity} ${unit || "kg"}).`,
      "contract_event",
      contract._id
    );

    return res.status(201).json({ message: "Contract created successfully", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating contract", error: error.message });
  }
};

// @desc    Get contracts relevant to the logged-in user's role with search & filter support
// @route   GET /api/contracts
// @access  Private
const getContracts = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "buyer") {
      filter = { buyer: req.user._id };
    } else if (req.user.role === "farmer") {
      filter = { farmer: req.user._id };
    }
    // Admin sees all contracts

    // Search query filter (search by cropName or contract ID)
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      if (req.query.search.trim().match(/^[0-9a-fA-F]{24}$/)) {
        filter._id = req.query.search.trim();
      } else {
        filter.cropName = searchRegex;
      }
    }

    // Status query filter
    if (req.query.status && req.query.status.trim() && req.query.status !== "All") {
      filter.status = req.query.status.trim();
    }

    const contracts = await Contract.find(filter)
      .populate("buyer", "name email phone address businessName businessPhotos profileImage verificationStatus")
      .populate("farmer", "name email phone address farmDetails profileImage verificationStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: contracts.length, contracts });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching contracts", error: error.message });
  }
};

// @desc    Get a single contract's details
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("buyer", "name email phone address businessName businessPhotos profileImage verificationStatus")
      .populate("farmer", "name email phone address farmDetails profileImage verificationStatus");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const isOwnerBuyer = req.user.role === "buyer" && contract.buyer._id.toString() === req.user._id.toString();
    const isAssignedFarmer =
      req.user.role === "farmer" && contract.farmer && contract.farmer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwnerBuyer && !isAssignedFarmer && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to view this contract" });
    }

    return res.status(200).json({ contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching contract", error: error.message });
  }
};

// @desc    Assigned farmer accepts a pending contract proposal
// @route   PUT /api/contracts/:id/accept
// @access  Private (farmer only)
const acceptContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer can accept this contract proposal" });
    }

    if (contract.status !== "Pending") {
      return res.status(400).json({ message: `Contract cannot be accepted when status is '${contract.status}'` });
    }

    contract.status = "Accepted";
    contract.statusHistory.push({ status: "Accepted", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "Contract Proposal Accepted",
      `Farmer ${req.user.name} accepted your contract proposal for ${contract.cropName}.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract accepted", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error accepting contract", error: error.message });
  }
};

// @desc    Assigned farmer rejects a pending contract proposal
// @route   PUT /api/contracts/:id/reject
// @access  Private (farmer only)
const rejectContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer can reject this contract proposal" });
    }

    if (contract.status !== "Pending") {
      return res.status(400).json({ message: `Contract cannot be rejected when status is '${contract.status}'` });
    }

    contract.status = "Rejected";
    contract.statusHistory.push({ status: "Rejected", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "Contract Proposal Rejected",
      `Farmer ${req.user.name} rejected your contract proposal for ${contract.cropName}.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract proposal rejected", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error rejecting contract", error: error.message });
  }
};

// @desc    Assigned farmer adds a progress update (note + optional image)
// @route   PUT /api/contracts/:id/progress
// @access  Private (farmer only)
const addProgress = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Progress note is required" });
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer can update progress" });
    }

    if (!["Accepted", "In Progress"].includes(contract.status)) {
      return res.status(400).json({ message: `Cannot add progress while contract status is '${contract.status}'` });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    contract.progressUpdates.push({
      note: note.trim(),
      image: imagePath,
      date: new Date(),
    });

    if (contract.status === "Accepted") {
      contract.status = "In Progress";
      contract.statusHistory.push({ status: "In Progress", timestamp: new Date() });
    }

    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "New Crop Progress Update",
      `Farmer ${req.user.name} added a progress update for ${contract.cropName}: "${note.trim()}".`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Progress update added successfully", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error adding progress", error: error.message });
  }
};

// @desc    Assigned farmer marks crop ready for delivery
// @route   PUT /api/contracts/:id/ready
// @access  Private (farmer only)
const markReady = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer can mark this contract ready" });
    }

    if (contract.status !== "In Progress") {
      return res.status(400).json({ message: "Contract must be 'In Progress' before it can be marked ready for delivery" });
    }

    contract.status = "Ready for Delivery";
    contract.statusHistory.push({ status: "Ready for Delivery", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "Crop Marked Ready for Delivery",
      `Farmer ${req.user.name} marked ${contract.cropName} as Ready for Delivery.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract marked ready for delivery", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating contract status", error: error.message });
  }
};

// @desc    Assigned farmer dispatches the crop
// @route   PUT /api/contracts/:id/dispatch
// @access  Private (farmer only)
const dispatchContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer can dispatch this contract" });
    }

    if (contract.status !== "Ready for Delivery") {
      return res.status(400).json({ message: "Contract must be 'Ready for Delivery' before it can be dispatched" });
    }

    contract.status = "Dispatched";
    contract.statusHistory.push({ status: "Dispatched", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "Crop Dispatched",
      `Farmer ${req.user.name} dispatched the shipment for ${contract.cropName}.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract dispatched successfully", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error dispatching contract", error: error.message });
  }
};

// @desc    Owning buyer confirms delivery received
// @route   PUT /api/contracts/:id/confirm-delivery
// @access  Private (buyer only)
const confirmDelivery = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the owning buyer can confirm delivery" });
    }

    if (contract.status !== "Dispatched") {
      return res.status(400).json({ message: "Contract must be 'Dispatched' before delivery can be confirmed" });
    }

    contract.status = "Delivered";
    contract.statusHistory.push({ status: "Delivered", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Farmer
    await createNotification(
      contract.farmer,
      "Buyer Confirmed Delivery",
      `Buyer ${req.user.name} confirmed receipt of delivery for ${contract.cropName}.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Delivery confirmed", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error confirming delivery", error: error.message });
  }
};

// @desc    Owning buyer completes the contract after delivery
// @route   PUT /api/contracts/:id/complete
// @access  Private (buyer only)
const completeContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the buyer who owns this contract can complete it" });
    }

    if (contract.status !== "Delivered") {
      return res.status(400).json({ message: "Contract must be 'Delivered' before it can be completed" });
    }

    contract.status = "Completed";
    contract.statusHistory.push({ status: "Completed", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Farmer
    await createNotification(
      contract.farmer,
      "Contract Completed",
      `Buyer ${req.user.name} marked contract ${contract.cropName} as Completed.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract marked completed", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error completing contract", error: error.message });
  }
};

// @desc    Owning buyer initiates payment (Pending -> Initiated)
// @route   PUT /api/contracts/:id/initiate-payment
// @access  Private (buyer only)
const initiatePayment = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the buyer who owns this contract can initiate payment" });
    }

    if (CLOSED_STATUSES.includes(contract.status) && contract.status !== "Completed") {
      return res.status(400).json({ message: "Cannot initiate payment on a rejected or cancelled contract" });
    }

    if (contract.paymentStatus !== "Pending") {
      return res.status(400).json({ message: `Payment already initiated or processed (current payment status: '${contract.paymentStatus}')` });
    }

    contract.paymentStatus = "Initiated";
    await contract.save();

    // Trigger Notification for the Farmer
    await createNotification(
      contract.farmer,
      "Payment Initiated by Buyer",
      `Buyer ${req.user.name} initiated payment of ₹${contract.totalAmount} for ${contract.cropName}. Please confirm receipt when received.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Payment initiated successfully", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error initiating payment", error: error.message });
  }
};

// @desc    Assigned farmer confirms payment received (Initiated -> Confirmed / Paid)
// @route   PUT /api/contracts/:id/confirm-payment
// @access  Private (farmer only)
const confirmPayment = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.farmer || contract.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned farmer recipient can confirm payment received" });
    }

    if (contract.paymentStatus !== "Initiated") {
      return res.status(400).json({ message: "Payment must be 'Initiated' by buyer before farmer can confirm receipt" });
    }

    contract.paymentStatus = "Paid";
    await contract.save();

    // Trigger Notification for the Buyer
    await createNotification(
      contract.buyer,
      "Farmer Confirmed Payment Receipt",
      `Farmer ${req.user.name} confirmed receipt of payment for ${contract.cropName}. Payment status is now Paid.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Payment receipt confirmed. Status marked Paid.", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error confirming payment", error: error.message });
  }
};

// @desc    Cancel a contract
// @route   PUT /api/contracts/:id/cancel
// @access  Private (owning buyer or admin)
const cancelContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const isOwnerBuyer = req.user.role === "buyer" && contract.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwnerBuyer && !isAdmin) {
      return res.status(403).json({ message: "Only the owning buyer or an admin can cancel this contract" });
    }

    if (CLOSED_STATUSES.includes(contract.status)) {
      return res.status(400).json({ message: `Contract is already '${contract.status}' and cannot be cancelled` });
    }

    if (isOwnerBuyer && !["Pending", "Accepted"].includes(contract.status)) {
      return res.status(400).json({
        message: "As a buyer you can only cancel a contract before farming progress has started",
      });
    }

    contract.status = "Cancelled";
    contract.statusHistory.push({ status: "Cancelled", timestamp: new Date() });
    await contract.save();

    // Trigger Notification for the Farmer
    await createNotification(
      contract.farmer,
      "Contract Cancelled",
      `Contract for ${contract.cropName} was cancelled by ${isAdmin ? "System Admin" : "Buyer " + req.user.name}.`,
      "contract_event",
      contract._id
    );

    return res.status(200).json({ message: "Contract cancelled successfully", contract });
  } catch (error) {
    return res.status(500).json({ message: "Server error cancelling contract", error: error.message });
  }
};

module.exports = {
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
};
