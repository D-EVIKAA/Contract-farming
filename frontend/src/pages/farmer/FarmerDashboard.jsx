import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getContracts,
  acceptContract,
  rejectContract,
  addProgressNote,
  markContractReady,
  dispatchContract,
  confirmPayment,
} from "../../services/contractService";
import { createDispute, getDisputes } from "../../services/disputeService";
import ContractCard from "../../components/ContractCard";
import ProgressModal from "../../components/ProgressModal";
import ProfileModal from "../../components/ProfileModal";
import DisputeModal from "../../components/DisputeModal";
import StatusBadge from "../../components/StatusBadge";
import UserProfileDrawer from "../../components/common/UserProfileDrawer";
import EmptyState from "../../components/common/EmptyState";
import PaymentHistoryTable from "../../components/PaymentHistoryTable";
import { getPaymentHistory } from "../../services/paymentService";
import { SkeletonCard, SkeletonStats } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import {
  Sprout,
  Plus,
  ShoppingBag,
  User,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
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

const FarmerDashboard = () => {
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

  // Modals & Side Drawers state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [progressModalContract, setProgressModalContract] = useState(null);
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
      toast.error(err.response?.data?.message || "Could not load dashboard data.");
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
        c.buyer?.name?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [contracts, filter, searchQuery]);

  const stats = useMemo(() => {
    const totalEarnings = contracts
      .filter((c) => c.paymentStatus === "Paid")
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const pendingEarnings = contracts
      .filter((c) => c.paymentStatus === "Initiated" || (c.status === "Completed" && c.paymentStatus !== "Paid"))
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    return {
      pending: contracts.filter((c) => c.status === "Pending").length,
      active: contracts.filter((c) => ["Accepted", "In Progress", "Ready for Delivery", "Dispatched"].includes(c.status)).length,
      completed: contracts.filter((c) => c.status === "Completed").length,
      totalEarnings,
      pendingEarnings,
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

  const handleAccept = (id) => runAction(id, acceptContract, "Contract proposal accepted!");
  const handleReject = (id) => runAction(id, rejectContract, "Contract proposal rejected.");
  const handleMarkReady = (id) => runAction(id, markContractReady, "Contract marked ready for delivery.");
  const handleDispatch = (id) => runAction(id, dispatchContract, "Crop dispatched successfully!");
  const handleConfirmPayment = (id) => runAction(id, confirmPayment, "Payment receipt confirmed!");

  const handleProgressSubmit = async (id, payload) => {
    setSubmittingModal(true);
    try {
      await addProgressNote(id, payload);
      toast.success("Progress update added successfully.");
      setProgressModalContract(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save progress update.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDisputeSubmit = async (payload) => {
    setSubmittingModal(true);
    try {
      await createDispute(payload);
      toast.success("Dispute raised successfully. Admin will review it.");
      setDisputeModalContract(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit dispute.");
    } finally {
      setSubmittingModal(false);
    }
  };

  if (loading) {
    return <SkeletonStats />;
  }

  const avatarUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          borderRadius: "16px",
          padding: "28px 24px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffffff" }} />
          ) : (
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ffffff", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "1.6rem", color: "#ffffff", fontWeight: 800 }}>
              <T>Welcome back</T>, {user.name}!
            </h1>
            <p style={{ margin: 0, fontSize: "0.92rem", opacity: 0.9 }}>
              <T>Farmer Dashboard</T> · <T>Farm Size</T>: {user.farmDetails?.farmSize || "N/A"} · <T>Crops</T>: {user.farmDetails?.cropsGrown || "N/A"}
            </p>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="btn"
            style={{ background: "#ffffff", color: "#065f46", fontWeight: 700, padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Sprout size={16} /> <T>Log Farm Progress</T>
          </button>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="btn"
            style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", fontWeight: 600, padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <User size={16} /> <T>Profile & Photos</T>
          </button>
        </div>
      </div>

      {/* Verification Status Banner Alert if Pending */}
      {user.verificationStatus !== "Verified" && (
        <div style={{ background: "#fffbeb", border: "1px solid #fef08a", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "0.9rem" }}>
            <ShieldAlert size={20} style={{ color: "#d97706" }} />
            <div>
              <strong><T>Profile Verification Pending</T>:</strong> <T>Complete your profile & Aadhaar OTP verification to increase buyer trust.</T>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{ background: "#d97706", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
          >
            <T>Verify Profile</T>
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Pending Proposals</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706" }}>{stats.pending}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Active Contracts</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0284c7" }}>{stats.active}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Completed Contracts</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669" }}>{stats.completed}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Confirmed Revenue</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669" }}>₹{stats.totalEarnings.toLocaleString("en-IN")}</span>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #f59e0b", padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Pending Payments</T></span>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706" }}>₹{stats.pendingEarnings.toLocaleString("en-IN")}</span>
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
            borderBottom: activeSection === "contracts" ? "3px solid #059669" : "3px solid transparent",
            color: activeSection === "contracts" ? "#059669" : "#64748b",
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
            borderBottom: activeSection === "payments" ? "3px solid #059669" : "3px solid transparent",
            color: activeSection === "payments" ? "#059669" : "#64748b",
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
          <span><T>Received Payments</T> ({payments.length})</span>
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
                placeholder="Search contracts by crop, ID, location, or buyer..."
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
                    borderColor: filter === f ? "#059669" : "#e2e8f0",
                    background: filter === f ? "#059669" : "#ffffff",
                    color: filter === f ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <T>{f}</T>
                </button>
              ))}
            </div>
          </div>

          {/* Active Contracts List */}
          <div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}>
              <T>My Assigned Contracts</T> ({visibleContracts.length})
            </h2>

            {visibleContracts.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No contracts found"
                description="No contracts match the selected filter criteria."
                actionLabel="Reset Filter"
                onAction={() => {
                  setFilter("All");
                  setSearchQuery("");
                }}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                {visibleContracts.map((c) => (
                  <ContractCard
                    key={c._id}
                    contract={c}
                    viewerRole="farmer"
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onAddProgress={setProgressModalContract}
                    onMarkReady={handleMarkReady}
                    onDispatch={handleDispatch}
                    onConfirmPayment={handleConfirmPayment}
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
        <PaymentHistoryTable payments={payments} userRole="farmer" onRefresh={loadData} />
      )}

      {/* Modals & Drawers */}
      <UserProfileDrawer
        user={selectedUserForDrawer}
        isOpen={!!selectedUserForDrawer}
        onClose={() => setSelectedUserForDrawer(null)}
        contracts={contracts}
      />

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(u) => updateUser(u)}
        />
      )}

      {progressModalContract && (
        <ProgressModal
          contract={progressModalContract}
          onClose={() => setProgressModalContract(null)}
          onSubmit={handleProgressSubmit}
          submitting={submittingModal}
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

export default FarmerDashboard;
