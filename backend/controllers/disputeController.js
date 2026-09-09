const Dispute = require("../models/Dispute");
const Contract = require("../models/Contract");

// @desc    Create a new dispute for a contract
// @route   POST /api/disputes
// @access  Private (buyer or farmer associated with the contract)
const createDispute = async (req, res) => {
  try {
    const { contractId, title, description } = req.body;

    if (!contractId || !title || !description) {
      return res.status(400).json({ message: "contractId, title, and description are required" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const isBuyer = contract.buyer.toString() === req.user._id.toString();
    const isFarmer = contract.farmer && contract.farmer.toString() === req.user._id.toString();

    if (!isBuyer && !isFarmer && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only raise a dispute for your own contract" });
    }

    const dispute = await Dispute.create({
      contract: contractId,
      raisedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      status: "Open",
    });

    return res.status(201).json({ message: "Dispute submitted successfully", dispute });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating dispute", error: error.message });
  }
};

// @desc    Get disputes relevant to user (or all disputes for admin)
// @route   GET /api/disputes
// @access  Private
const getDisputes = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      filter = { raisedBy: req.user._id };
    }

    const disputes = await Dispute.find(filter)
      .populate("contract", "cropName status buyer farmer")
      .populate("raisedBy", "name email role")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: disputes.length, disputes });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching disputes", error: error.message });
  }
};

// @desc    Get a single dispute by ID
// @route   GET /api/disputes/:id
// @access  Private
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("contract")
      .populate("raisedBy", "name email role")
      .populate("resolvedBy", "name email");

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    const isRaiser = dispute.raisedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isRaiser && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to view this dispute" });
    }

    return res.status(200).json({ dispute });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching dispute", error: error.message });
  }
};

// @desc    Admin updates dispute status and resolution details
// @route   PUT /api/disputes/:id/status
// @access  Private (admin only)
const updateDisputeStatus = async (req, res) => {
  try {
    const { status, resolutionDetails } = req.body;

    const validStatuses = ["Open", "Under Review", "Resolved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    dispute.status = status;
    if (resolutionDetails !== undefined) {
      dispute.resolutionDetails = resolutionDetails.trim();
    }
    if (["Resolved", "Rejected"].includes(status)) {
      dispute.resolvedBy = req.user._id;
    }

    await dispute.save();

    return res.status(200).json({ message: "Dispute status updated by admin", dispute });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating dispute status", error: error.message });
  }
};

module.exports = {
  createDispute,
  getDisputes,
  getDisputeById,
  updateDisputeStatus,
};
