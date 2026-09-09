import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, updateUserStatus, deleteUser } from "../../services/userService";
import { getContracts } from "../../services/contractService";
import { getDisputes, updateDisputeStatus } from "../../services/disputeService";
import StatusBadge from "../../components/StatusBadge";
import ContractCard from "../../components/ContractCard";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'contracts' | 'disputes'

  // Data states
  const [users, setUsers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Confirmation Modal state for user deletion
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Dispute resolution modal state
  const [disputeToResolve, setDisputeToResolve] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("Resolved");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadAllData = useCallback(async () => {
    setError("");
    try {
      const [usersData, contractsData, disputesData] = await Promise.all([
        getAllUsers(),
        getContracts(),
        getDisputes(),
      ]);
      setUsers(usersData || []);
      setContracts(contractsData || []);
      setDisputes(disputesData || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleToggleUserStatus = async (userId, currentIsActive) => {
    setError("");
    try {
      await updateUserStatus(userId, !currentIsActive);
      setSuccess(`User status updated to ${!currentIsActive ? "Active" : "Inactive"}`);
      await loadAllData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setError("");
    try {
      await deleteUser(userToDelete._id);
      setSuccess(`User ${userToDelete.name} deleted successfully.`);
      setUserToDelete(null);
      await loadAllData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleDisputeResolutionSubmit = async (e) => {
    e.preventDefault();
    if (!disputeToResolve) return;
    setSubmittingDispute(true);
    setError("");
    try {
      await updateDisputeStatus(disputeToResolve._id, resolutionStatus, resolutionDetails);
      setSuccess("Dispute status updated successfully.");
      setDisputeToResolve(null);
      setResolutionDetails("");
      await loadAllData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update dispute status.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header-bar">
        <div>
          <h1>System Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome, <strong>{user?.name}</strong> · Full System Control & Governance
          </p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === "users" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management ({users.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "contracts" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("contracts")}
        >
          All Contracts ({contracts.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "disputes" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("disputes")}
        >
          Dispute System ({disputes.length})
        </button>
      </div>

      {/* USER MANAGEMENT TAB */}
      {activeTab === "users" && (
        <section className="dashboard-section">
          <h2>Registered Farmers & Buyers</h2>
          {users.length === 0 ? (
            <p className="empty-state">No users registered in the system.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role.toUpperCase()}</span></td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <StatusBadge status={u.isActive ? "Resolved" : "Rejected"} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-primary"}`}
                          onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          style={{ marginLeft: "8px" }}
                          onClick={() => setUserToDelete(u)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* CONTRACT OVERVIEW TAB */}
      {activeTab === "contracts" && (
        <section className="dashboard-section">
          <h2>System-wide Contracts Oversight</h2>
          {contracts.length === 0 ? (
            <p className="empty-state">No contracts found in system.</p>
          ) : (
            <div className="contract-list">
              {contracts.map((c) => (
                <ContractCard key={c._id} contract={c} viewerRole="admin" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* DISPUTE SYSTEM TAB */}
      {activeTab === "disputes" && (
        <section className="dashboard-section">
          <h2>Contract Disputes Resolution</h2>
          {disputes.length === 0 ? (
            <p className="empty-state">No disputes submitted.</p>
          ) : (
            <div className="disputes-admin-list">
              {disputes.map((d) => (
                <div key={d._id} className="dispute-card">
                  <div className="dispute-card-header">
                    <h3>{d.title}</h3>
                    <StatusBadge status={d.status} />
                  </div>
                  <p><strong>Raised By:</strong> {d.raisedBy?.name} ({d.raisedBy?.role?.toUpperCase()}) - {d.raisedBy?.email}</p>
                  <p><strong>Contract:</strong> {d.contract?.cropName || d.contract}</p>
                  <p><strong>Issue Description:</strong> {d.description}</p>
                  {d.resolutionDetails && (
                    <p className="dispute-resolution">
                      <strong>Current Resolution:</strong> {d.resolutionDetails}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: "12px" }}
                    onClick={() => {
                      setDisputeToResolve(d);
                      setResolutionStatus(d.status === "Open" ? "Under Review" : d.status);
                      setResolutionDetails(d.resolutionDetails || "");
                    }}
                  >
                    Manage / Resolve Dispute
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="modal-overlay" onClick={() => setUserToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm User Deletion</h2>
            <p style={{ margin: "16px 0" }}>
              Are you sure you want to delete user <strong>{userToDelete.name}</strong> ({userToDelete.email})?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setUserToDelete(null)}
                disabled={deletingUser}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? "Deleting..." : "Yes, Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE RESOLUTION MODAL */}
      {disputeToResolve && (
        <div className="modal-overlay" onClick={() => setDisputeToResolve(null)}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <h2>Resolve Dispute: {disputeToResolve.title}</h2>
            <p className="auth-subtitle">Raised by {disputeToResolve.raisedBy?.name}</p>

            <form onSubmit={handleDisputeResolutionSubmit}>
              <label className="field">
                <span>Update Status</span>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>

              <label className="field">
                <span>Admin Resolution Details / Notes</span>
                <textarea
                  rows={4}
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  placeholder="Enter official resolution notes or admin decision..."
                  required
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDisputeToResolve(null)}
                  disabled={submittingDispute}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingDispute}>
                  {submittingDispute ? "Updating..." : "Save Resolution"}
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
