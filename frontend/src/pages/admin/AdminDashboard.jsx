import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getVerificationUsers,
  updateVerificationStatus,
} from "../../services/userService";
import { getContracts } from "../../services/contractService";
import { getDisputes, updateDisputeStatus } from "../../services/disputeService";
import { getSystemStats } from "../../services/adminService";
import PaymentHistoryTable from "../../components/PaymentHistoryTable";
import { getPaymentHistory } from "../../services/paymentService";
import StatusBadge from "../../components/StatusBadge";
import ContractCard from "../../components/ContractCard";
import UserProfileDrawer from "../../components/common/UserProfileDrawer";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTable, SkeletonStats } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import {
  ShieldCheck,
  Users,
  FileText,
  ShieldAlert,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Lock,
  Unlock,
  CreditCard
} from "lucide-react";
import { T } from "../../components/common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("analytics");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [verificationUsers, setVerificationUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);

  // User inspection & deletion modals
  const [selectedUserDrawer, setSelectedUserDrawer] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Dispute resolution state
  const [disputeToResolve, setDisputeToResolve] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("Resolved");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [statsData, usersData, contractsData, disputesData, verifData, paymentsData] = await Promise.all([
        getSystemStats().catch(() => null),
        getAllUsers().catch(() => []),
        getContracts().catch(() => []),
        getDisputes().catch(() => []),
        getVerificationUsers().catch(() => []),
        getPaymentHistory().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setContracts(contractsData || []);
      setDisputes(disputesData || []);
      setVerificationUsers(verifData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      toast.error("Could not load admin dashboard records.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleToggleUserStatus = async (userId, currentIsActive) => {
    try {
      await updateUserStatus(userId, !currentIsActive);
      toast.success(`User account ${!currentIsActive ? "activated" : "deactivated"}.`);
      await loadAllData();
    } catch (err) {
      toast.error("Failed to update user status.");
    }
  };

  const handleVerifyUser = async (userId, newStatus) => {
    try {
      await updateVerificationStatus(userId, newStatus);
      toast.success(`User verification status set to ${newStatus}.`);
      if (selectedUserDrawer && selectedUserDrawer._id === userId) {
        setSelectedUserDrawer(null);
      }
      await loadAllData();
    } catch (err) {
      toast.error("Failed to update verification status.");
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await deleteUser(userToDelete._id);
      toast.success(`User ${userToDelete.name} deleted.`);
      setUserToDelete(null);
      await loadAllData();
    } catch (err) {
      toast.error("Failed to delete user account.");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleDisputeResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!disputeToResolve) return;
    setSubmittingDispute(true);
    try {
      await updateDisputeStatus(disputeToResolve._id, resolutionStatus, resolutionDetails);
      toast.success("Dispute resolution saved.");
      setDisputeToResolve(null);
      await loadAllData();
    } catch (err) {
      toast.error("Failed to save dispute resolution.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const filteredVerificationUsers = verificationUsers.filter((u) => {
    if (verificationFilter === "All") return true;
    return (u.verificationStatus || "Pending") === verificationFilter;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "16px",
          padding: "28px 24px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
            <ShieldCheck size={14} /> <T>System Command Center</T>
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.7rem", color: "#ffffff", fontWeight: 800 }}>
            <T>System Administrator Control Dashboard</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8" }}>
            <T>Full system governance, user verification queue, contract oversight, and dispute resolution.</T>
          </p>
        </div>
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", flexWrap: "wrap" }}>
        {[
          { key: "analytics", title: "System Analytics", count: null, icon: BarChart3 },
          { key: "users", title: "User Management", count: users.length, icon: Users },
          { key: "verification", title: "Verification Queue", count: verificationUsers.filter((u) => (u.verificationStatus || "Pending") === "Pending").length, icon: ShieldCheck },
          { key: "contracts", title: "All Contracts", count: contracts.length, icon: FileText },
          { key: "disputes", title: "Dispute Governance", count: disputes.length, icon: ShieldAlert },
          { key: "payments", title: "Payments Audit", count: payments.length, icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "0.88rem",
                fontWeight: 600,
                border: "none",
                background: isActive ? "#0f172a" : "#f1f5f9",
                color: isActive ? "#ffffff" : "#475569",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <Icon size={16} /> <span><T>{tab.title}</T>{tab.count !== null ? ` (${tab.count})` : ""}</span>
            </button>
          );
        })}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Registered Users</T></div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                {stats?.users?.total ?? users.length}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                <T>Farmers</T>: {stats?.users?.farmers ?? 0} · <T>Buyers</T>: {stats?.users?.buyers ?? 0}
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Contracts</T></div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                {stats?.contracts?.total ?? contracts.length}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                <T>Completed</T>: {stats?.contracts?.byStatus?.Completed ?? 0}
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #3b82f6" }}>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Contract Value</T></div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                ₹{Number(stats?.financials?.totalAgreedValue || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Settled Payments</T></div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                ₹{Number(stats?.financials?.totalPaidAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === "users" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#0f172a" }}>
            <T>Registered Farmers & Buyers</T>
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th><T>User Details</T></th>
                  <th><T>Role</T></th>
                  <th><T>Contact Info</T></th>
                  <th><T>Aadhaar Status</T></th>
                  <th><T>Account Status</T></th>
                  <th><T>Actions</T></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.role}`}><T>{u.role.toUpperCase()}</T></span>
                    </td>
                    <td>
                      <div>{u.phone || "—"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{u.address || "—"}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8rem", color: u.aadhaarVerified ? "#15803d" : "#94a3b8", fontWeight: 600 }}>
                        {u.aadhaarVerified ? <><T>✓ Verified</T> (XXXX-{u.aadhaarLast4})</> : <T>Unverified</T>}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={u.isActive ? "Resolved" : "Rejected"} size="small" />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-primary"}`}
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                        >
                          <T>{u.isActive ? "Deactivate" : "Activate"}</T>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setUserToDelete(u)}
                        >
                          <T>Delete</T>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VERIFICATION QUEUE TAB */}
      {activeTab === "verification" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
              <T>User Verification Queue</T>
            </h3>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Pending", "Verified", "Rejected", "All"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setVerificationFilter(st)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: "none",
                    background: verificationFilter === st ? "#0f172a" : "#f1f5f9",
                    color: verificationFilter === st ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  <T>{st}</T>
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th><T>User</T></th>
                  <th><T>Role</T></th>
                  <th><T>Verification Evidence</T></th>
                  <th><T>Status</T></th>
                  <th><T>Actions</T></th>
                </tr>
              </thead>
              <tbody>
                {filteredVerificationUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{u.name}</strong>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{u.email}</div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.role}`}><T>{u.role.toUpperCase()}</T></span>
                    </td>
                    <td>
                      {u.role === "farmer" ? (
                        <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                          <T>Size</T>: {u.farmDetails?.farmSize || "N/A"} · <T>Photos</T>: {u.farmDetails?.farmPhotos?.length || 0}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                          <T>Business</T>: {u.businessName || "N/A"}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={u.verificationStatus || "Pending"} size="small" />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedUserDrawer(u)}
                        >
                          <T>Inspect Profile</T>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => handleVerifyUser(u._id, "Verified")}
                        >
                          <T>✓ Verify</T>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleVerifyUser(u._id, "Rejected")}
                        >
                          <T>✕ Reject</T>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTRACTS OVERVIEW TAB */}
      {activeTab === "contracts" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {contracts.map((c) => (
            <ContractCard key={c._id} contract={c} viewerRole="admin" />
          ))}
        </div>
      )}

      {/* DISPUTES GOVERNANCE TAB */}
      {activeTab === "disputes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {disputes.map((d) => (
            <div key={d._id} style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ef4444" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>{d.title}</h3>
                <StatusBadge status={d.status} />
              </div>
              <p style={{ margin: "8px 0", color: "#475569", fontSize: "0.9rem" }}>{d.description}</p>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                <T>Raised by</T>: {d.raisedBy?.name} ({d.raisedBy?.email})
              </div>
              <button
                type="button"
                onClick={() => {
                  setDisputeToResolve(d);
                  setResolutionStatus(d.status === "Open" ? "Under Review" : d.status);
                  setResolutionDetails(d.resolutionDetails || "");
                }}
                className="btn btn-primary"
                style={{ marginTop: "12px", fontSize: "0.85rem" }}
              >
                <T>Resolve Ticket</T>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENTS AUDIT TAB */}
      {activeTab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PaymentHistoryTable payments={payments} userRole="admin" onRefresh={loadAllData} />
        </div>
      )}

      <UserProfileDrawer
        user={selectedUserDrawer}
        isOpen={!!selectedUserDrawer}
        onClose={() => setSelectedUserDrawer(null)}
        contracts={contracts}
      />

      {/* User Deletion Modal */}
      {userToDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.5)" }}>
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#ef4444" }}><T>Confirm User Deletion</T></h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "#475569" }}>
              <T>Are you sure you want to delete user</T> <strong>{userToDelete.name}</strong> ({userToDelete.email})? <T>This action cannot be undone.</T>
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setUserToDelete(null)} className="btn btn-outline"><T>Cancel</T></button>
              <button type="button" onClick={handleConfirmDeleteUser} disabled={deletingUser} className="btn btn-danger">
                {deletingUser ? <T>Deleting...</T> : <T>Yes, Delete User</T>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {disputeToResolve && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.5)" }}>
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", maxWidth: "480px", width: "100%" }}>
            <h3 style={{ margin: "0 0 12px 0" }}><T>Resolve Dispute</T>: {disputeToResolve.title}</h3>
            <form onSubmit={handleDisputeResolutionSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Status</T></label>
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
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}><T>Resolution Details</T></label>
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
                <button type="button" onClick={() => setDisputeToResolve(null)} className="btn btn-outline"><T>Cancel</T></button>
                <button type="submit" disabled={submittingDispute} className="btn btn-primary">
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

export default AdminDashboard;
