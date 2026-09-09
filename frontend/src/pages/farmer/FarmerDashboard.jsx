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
  const { user, login } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState(null);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [progressModalContract, setProgressModalContract] = useState(null);
  const [disputeModalContract, setDisputeModalContract] = useState(null);
  const [submittingModal, setSubmittingModal] = useState(false);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [contractsData, disputesData] = await Promise.all([
        getContracts(),
        getDisputes(),
      ]);
      setContracts(contractsData || []);
      setDisputes(disputesData || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const visibleContracts = useMemo(() => {
    if (filter === "All") return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const stats = useMemo(
    () => ({
      pending: contracts.filter((c) => c.status === "Pending").length,
      active: contracts.filter((c) => ["Accepted", "In Progress", "Ready for Delivery", "Dispatched"].includes(c.status)).length,
      completed: contracts.filter((c) => c.status === "Completed").length,
      paymentInitiated: contracts.filter((c) => c.paymentStatus === "Initiated").length,
    }),
    [contracts]
  );

  const runAction = async (id, actionFn, successText) => {
    setActionLoading(id);
    setError("");
    try {
      await actionFn(id);
      setSuccessMessage(successText);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = (id) => runAction(id, acceptContract, "Contract proposal accepted.");
  const handleReject = (id) => runAction(id, rejectContract, "Contract proposal rejected.");
  const handleMarkReady = (id) => runAction(id, markContractReady, "Contract marked ready for delivery.");
  const handleDispatch = (id) => runAction(id, dispatchContract, "Crop dispatched successfully.");
  const handleConfirmPayment = (id) => runAction(id, confirmPayment, "Payment receipt confirmed! Status set to Paid.");

  const handleProgressSubmit = async (id, payload) => {
    setSubmittingModal(true);
    setError("");
    try {
      await addProgressNote(id, payload);
      setSuccessMessage("Progress update added successfully.");
      setProgressModalContract(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save progress update.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDisputeSubmit = async (payload) => {
    setSubmittingModal(true);
    setError("");
    try {
      await createDispute(payload);
      setSuccessMessage("Dispute raised successfully. Admin will review it.");
      setDisputeModalContract(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit dispute.");
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleProfileUpdated = (updatedUserDoc) => {
    const token = localStorage.getItem("token");
    if (token && updatedUserDoc) {
      login(token, updatedUserDoc);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading your farmer dashboard...</div>;
  }

  const avatarUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  return (
    <div className="farmer-dashboard">
      <div className="dashboard-header-bar">
        <div className="dashboard-user-info">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user?.name} className="dashboard-user-avatar" />
          ) : (
            <div className="dashboard-user-avatar-placeholder">
              {user?.name ? user.name.charAt(0).toUpperCase() : "F"}
            </div>
          )}
          <div>
            <h1>Welcome, {user?.name}</h1>
            <p className="dashboard-subtitle">
              Farmer Dashboard · Phone: {user?.phone || "Not provided"} · Farm Size: {user?.farmDetails?.farmSize || "N/A"}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setShowProfileModal(true)}>
          Manage Profile & Photos
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending Proposals</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active Contracts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.paymentInitiated}</span>
          <span className="stat-label">Payments Awaiting Confirmation</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Completed Contracts</span>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-tab ${filter === f ? "filter-tab-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="dashboard-section">
        <h2>My Assigned Contracts</h2>
        {visibleContracts.length === 0 ? (
          <p className="empty-state">No contracts match the selected filter.</p>
        ) : (
          <div className="contract-list">
            {visibleContracts.map((contract) => (
              <ContractCard
                key={contract._id}
                contract={contract}
                viewerRole="farmer"
                onAccept={handleAccept}
                onReject={handleReject}
                onAddProgress={setProgressModalContract}
                onMarkReady={handleMarkReady}
                onDispatch={handleDispatch}
                onConfirmPayment={handleConfirmPayment}
                onRaiseDispute={setDisputeModalContract}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </section>

      {disputes.length > 0 && (
        <section className="dashboard-section disputes-section">
          <h2>My Raised Disputes</h2>
          <div className="disputes-list">
            {disputes.map((d) => (
              <div key={d._id} className="dispute-card">
                <div className="dispute-card-header">
                  <h4>{d.title}</h4>
                  <StatusBadge status={d.status} />
                </div>
                <p><strong>Contract:</strong> {d.contract?.cropName || d.contract}</p>
                <p><strong>Description:</strong> {d.description}</p>
                {d.resolutionDetails && (
                  <p className="dispute-resolution">
                    <strong>Admin Resolution:</strong> {d.resolutionDetails}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={handleProfileUpdated}
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
