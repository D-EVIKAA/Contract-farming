const User = require("../models/User");
const Contract = require("../models/Contract");
const Dispute = require("../models/Dispute");

// @desc    Get system-wide analytics and statistics for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFarmers,
      activeFarmers,
      totalBuyers,
      activeBuyers,
      totalContracts,
      contractsByStatus,
      totalDisputes,
      pendingDisputes,
      resolvedDisputes,
      financialData,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "farmer", isActive: true }),
      User.countDocuments({ role: "buyer" }),
      User.countDocuments({ role: "buyer", isActive: true }),
      Contract.countDocuments({}),
      Contract.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Dispute.countDocuments({}),
      Dispute.countDocuments({ status: { $in: ["Pending", "Under Investigation"] } }),
      Dispute.countDocuments({ status: { $in: ["Resolved", "Dismissed"] } }),
      Contract.aggregate([
        {
          $group: {
            _id: null,
            totalAgreedValue: { $sum: "$totalAmount" },
            totalPaidAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "Paid"] }, "$totalAmount", 0]
              }
            }
          }
        }
      ]),
    ]);

    const statusCounts = {};
    contractsByStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    const financialTotals = financialData.length > 0 ? financialData[0] : { totalAgreedValue: 0, totalPaidAmount: 0 };

    return res.status(200).json({
      users: {
        total: totalUsers,
        farmers: totalFarmers,
        activeFarmers,
        buyers: totalBuyers,
        activeBuyers,
      },
      contracts: {
        total: totalContracts,
        byStatus: statusCounts,
      },
      disputes: {
        total: totalDisputes,
        pending: pendingDisputes,
        resolved: resolvedDisputes,
      },
      financials: {
        totalAgreedValue: financialTotals.totalAgreedValue || 0,
        totalPaidAmount: financialTotals.totalPaidAmount || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching admin statistics", error: error.message });
  }
};

module.exports = {
  getSystemStats,
};
