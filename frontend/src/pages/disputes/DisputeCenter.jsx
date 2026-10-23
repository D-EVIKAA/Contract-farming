import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDisputes, createDispute, updateDisputeStatus } from "../../services/disputeService";
import { getContracts } from "../../services/contractService";
import { ShieldAlert, Plus, Calendar, User, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import DisputeModal from "../../components/DisputeModal";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTable } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const DisputeCenter = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [disputes, setDisputes] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adminResolutionModal, setAdminResolutionModal] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("Resolved");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [disputesData, contractsData] = await Promise.all([
        getDisputes().catch(() => []),
        getContracts().catch(() => []),
      ]);
      setDisputes(disputesData || []);
      setContracts(contractsData || []);
    } catch (err) {
      toast.error("Could not load dispute records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createDispute(payload);
      toast.success("Dispute raised successfully. System Admin will review it.");
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!adminResolutionModal) return;
    setSubmitting(true);
    try {
      await updateDisputeStatus(adminResolutionModal._id, resolutionStatus, resolutionDetails);
      toast.success("Dispute resolution status updated.");
      setAdminResolutionModal(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update dispute status.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonTable />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)",
          borderRadius: "16px",
          padding: "28px 24px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
            <ShieldAlert size={14} /> <T>Conflict Governance</T>
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.7rem", color: "#ffffff", fontWeight: 800 }}>
            <T>Dispute Resolution Center</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", opacity: 0.9 }}>
            <T>Submit contract disputes, view official investigation status, and track admin resolutions.</T>
          </p>
        </div>

        {user.role !== "admin" && contracts.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn"
            style={{ background: "#ffffff", color: "#991b1b", fontWeight: 700, padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            + <T>Raise New Dispute</T>
          </button>
        )}
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No dispute tickets filed"
          description="There are currently no open or historical contract dispute tickets."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {disputes.map((d) => (
            <div
              key={d._id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${d.status === "Open" ? "#ef4444" : d.status === "Resolved" ? "#10b981" : "#f59e0b"}`,
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 700 }}><T>{d.title}</T></h3>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                    <T>Raised on</T>: {new Date(d.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>

              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "0.88rem", color: "#334155" }}>
                <p style={{ margin: 0 }}><strong><T>Description</T>:</strong> <T>{d.description}</T></p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                <span><strong><T>Contract</T>:</strong> <T>{d.contract?.cropName || d.contract}</T></span>
                <span><strong><T>Raised By</T>:</strong> {d.raisedBy?.name || "User"}</span>
              </div>

              {d.resolutionDetails && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", color: "#065f46" }}>
                  <strong><T>Admin Resolution</T>:</strong> <T>{d.resolutionDetails}</T>
                </div>
              )}

              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminResolutionModal(d);
                    setResolutionStatus(d.status === "Open" ? "Under Review" : d.status);
                    setResolutionDetails(d.resolutionDetails || "");
                  }}
                  className="btn btn-primary"
                  style={{ marginTop: "6px", fontSize: "0.85rem" }}
                >
                  <T>Manage / Resolve Ticket</T>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <DisputeModal
          contract={contracts[0]}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
          submitting={submitting}
        />
      )}

      {adminResolutionModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.5)" }}>
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "480px" }}>
            <h3 style={{ margin: "0 0 12px 0" }}><T>Resolve Dispute</T>: {adminResolutionModal.title}</h3>
            <form onSubmit={handleAdminResolutionSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  <T>Status</T>
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Open">Open</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  <T>Resolution Notes</T>
                </label>
                <textarea
                  rows={4}
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  required
                  placeholder="Enter resolution notes..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setAdminResolutionModal(null)} className="btn btn-outline">
                  <T>Cancel</T>
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <T>Save Resolution</T>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeCenter;
