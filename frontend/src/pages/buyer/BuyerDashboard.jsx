import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getContracts,
  createContract,
  confirmDelivery,
  completeContract,
  initiatePayment,
  cancelContract,
} from "../../services/contractService";
import { createDispute, getDisputes } from "../../services/disputeService";
import ContractCard from "../../components/ContractCard";
import CreateContractModal from "../../components/CreateContractModal";
import ProfileModal from "../../components/ProfileModal";
import DisputeModal from "../../components/DisputeModal";
import StatusBadge from "../../components/StatusBadge";
import UserProfileDrawer from "../../components/common/UserProfileDrawer";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonStats } from "../../components/common/SkeletonLoader";
import PaymentHistoryTable from "../../components/PaymentHistoryTable";
import { getPaymentHistory } from "../../services/paymentService";
import { useToast } from "../../context/ToastContext";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  User,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Truck,
  CheckCircle2,
  CreditCard,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { T } from "../../components/common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const FILTERS = [
  "All",
  "Pending",
  "Accepted",
  "In Progress",
  "Ready for Delivery",
  "Dispatched",
  "Delivered",
  "Completed",
  "Cancelled",
];

const BuyerDashboard = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeSection, setActiveSection] = useState("contracts"); // "contracts" | "payments"
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Modals & Drawers state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [disputeModalContract, setDisputeModalContract] = useState(null);
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState(null);
  const [submittingModal, setSubmittingModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [contractsData, disputesData, paymentsData] = await Promise.all([
        getContracts(),
        getDisputes(),
        getPaymentHistory().catch(() => []),
      ]);
      setContracts(contractsData || []);
      setDisputes(disputesData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load buyer dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesFilter = filter === "All" || c.status === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.cropName?.toLowerCase().includes(q) ||
        c._id?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.farmer?.name?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [contracts, filter, searchQuery]);

  const stats = useMemo(() => {
    const totalSpent = contracts
      .filter((c) => c.paymentStatus === "Paid")
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const pendingPayables = contracts
      .filter((c) => c.paymentStatus === "Initiated" || (c.status === "Completed" && c.paymentStatus !== "Paid"))
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    return {
      pending: contracts.filter((c) => c.status === "Pending").length,
      dispatched: contracts.filter((c) => c.status === "Dispatched").length,
      delivered: contracts.filter((c) => c.status === "Delivered").length,
      completed: contracts.filter((c) => c.status === "Completed").length,
      totalSpent,
      pendingPayables,
    };
  }, [contracts]);

  const runAction = async (id, actionFn, successText) => {
    setActionLoading(id);
    try {
      await actionFn(id);
      toast.success(successText);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubmit = async (payload) => {
    setSubmittingModal(true);
    try {
      await createContract(payload);
      toast.success("Contract created and proposed to farmer successfully!");
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create contract.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleConfirmDelivery = (id) => runAction(id, confirmDelivery, "Delivery confirmed!");
  const handleComplete = (id) => runAction(id, completeContract, "Contract marked as completed!");
  const handleInitiatePayment = (id) => runAction(id, initiatePayment, "Payment initiated successfully!");
  const handleCancel = (id) => runAction(id, cancelContract, "Contract cancelled.");

  const handleDisputeSubmit = async (payload) => {
    setSubmittingModal(true);
    try {
      await createDispute(payload);
      toast.success("Dispute submitted successfully. Admin will review it.");
      setDisputeModalContract(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit dispute.");
    } finally {
      setSubmittingModal(false);
    }
  };

  if (loading) return <SkeletonStats />;

  const avatarUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          borderRadius: "16px",
          padding: "28px 24px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffffff" }} />
          ) : (
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "1.6rem", color: "#ffffff", fontWeight: 800 }}>
              <T>Welcome back</T>, {user.name}!
            </h1>
            <p style={{ margin: 0, fontSize: "0.92rem", opacity: 0.9 }}>
              <T>Buyer Dashboard</T> · <T>Business</T>: {user.businessName || "Not set"} · <T>Phone Number</T>: {user.phone || "Not set"}
            </p>
          </div>
        </div>

        {/* Shortcuts */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{ background: "#ffffff", color: "#0369a1", fontWeight: 700, padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> <T>Create New Contract</T>
          </button>
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="btn"
            style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", fontWeight: 600, padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShoppingBag size={16} /> <T>Browse Marketplace</T>
          </button>
        </div>
      </div>

      {/* Verification Status Banner Alert */}
      {user.verificationStatus !== "Verified" && (
        <div style={{ background: "#fffbeb", border: "1px solid #fef08a", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "0.9rem" }}>
            <ShieldAlert size={20} style={{ color: "#d97706" }} />
            <div>
              <strong><T>Profile Verification Pending:</T></strong> <T>Complete business verification to get verified status badge.</T>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{ background: "#d97706", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
          >
            <T>Verify Business</T>
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Pending Proposals</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706" }}>{stats.pending}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Dispatched Shipments</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#3b82f6" }}>{stats.dispatched}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Completed Contracts</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669" }}>{stats.completed}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #3b82f6", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Expenditure</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#3b82f6" }}>₹{stats.totalSpent.toLocaleString("en-IN")}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ef4444", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Pending Payables</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ef4444" }}>₹{stats.pendingPayables.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Navigation Section Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", paddingBottom: "4px" }}>
        <button
          type="button"
          onClick={() => setActiveSection("contracts")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeSection === "contracts" ? "3px solid #0284c7" : "3px solid transparent",
            color: activeSection === "contracts" ? "#0284c7" : "#64748b",
            fontWeight: 700,
            fontSize: "1rem",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-6px",
          }}
        >
          <FileText size={18} />
          <span><T>My Contracts</T> ({contracts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("payments")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeSection === "payments" ? "3px solid #0284c7" : "3px solid transparent",
            color: activeSection === "payments" ? "#0284c7" : "#64748b",
            fontWeight: 700,
            fontSize: "1rem",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-6px",
          }}
        >
          <CreditCard size={18} />
          <span><T>Payment Gateway History</T> ({payments.length})</span>
        </button>
      </div>

      {activeSection === "contracts" ? (
        <>
          {/* Filter and Search Bar */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "260px", display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 14px" }}>
              <Search size={18} style={{ color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search contracts by crop, ID, location, or farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: "0.92rem", color: "#0f172a" }}
              />
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: filter === f ? "#0284c7" : "#e2e8f0",
                    background: filter === f ? "#0284c7" : "#ffffff",
                    color: filter === f ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <T>{f}</T>
                </button>
              ))}
            </div>
          </div>

          {/* Contracts Grid */}
          <div>
            {visibleContracts.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No contracts found"
                description="No contracts match your current filter criteria."
                actionLabel="Create Contract"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                {visibleContracts.map((c) => (
                  <ContractCard
                    key={c._id}
                    contract={c}
                    viewerRole="buyer"
                    onConfirmDelivery={handleConfirmDelivery}
                    onComplete={handleComplete}
                    onInitiatePayment={loadData}
                    onCancel={handleCancel}
                    onRaiseDispute={setDisputeModalContract}
                    onOpenUserDrawer={(u) => setSelectedUserForDrawer(u)}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}>
              <T>Payment Gateway Transactions & Orders</T>
            </h2>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              <T>Cryptographically verified Razorpay transactions with audit reference</T>
            </span>
          </div>
          <PaymentHistoryTable payments={payments} viewerRole="buyer" />
        </div>
      )}

      {/* Modals & Drawers */}
      <UserProfileDrawer
        user={selectedUserForDrawer}
        isOpen={!!selectedUserForDrawer}
        onClose={() => setSelectedUserForDrawer(null)}
        contracts={contracts}
      />

      {showCreateModal && (
        <CreateContractModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
          submitting={submittingModal}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(u) => updateUser(u)}
        />
      )}

      {disputeModalContract && (
        <DisputeModal
          contract={disputeModalContract}
          onClose={() => setDisputeModalContract(null)}
          onSubmit={handleDisputeSubmit}
          submitting={submittingModal}
        />
      )}
    </div>
  );
};

export default BuyerDashboard;
