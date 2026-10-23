import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getContracts, addProgressNote } from "../../services/contractService";
import { Sprout, Calendar, Image as ImageIcon, Plus, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import ProgressModal from "../../components/ProgressModal";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonCard } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const STAGES = [
  "Contract Started",
  "Land Preparation",
  "Cultivation",
  "Crop Growth",
  "Harvest Preparation",
  "Ready for Delivery",
];

const FarmProgressCenter = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [progressModalContract, setProgressModalContract] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getContracts();
      const activeOrAccepted = (data || []).filter((c) =>
        ["Accepted", "In Progress", "Ready for Delivery", "Dispatched", "Delivered", "Completed"].includes(c.status)
      );
      setContracts(activeOrAccepted);
      if (activeOrAccepted.length > 0 && !selectedContractId) {
        setSelectedContractId(activeOrAccepted[0]._id);
      }
    } catch (err) {
      toast.error("Could not load farm progress data.");
    } finally {
      setLoading(false);
    }
  }, [selectedContractId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedContract = contracts.find((c) => c._id === selectedContractId) || contracts[0];

  const handleProgressSubmit = async (contractId, payload) => {
    try {
      await addProgressNote(contractId, payload);
      toast.success("Crop progress note logged successfully!");
      setProgressModalContract(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add progress update.");
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
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
            <Sprout size={14} /> <T>Production Tracking Center</T>
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.7rem", color: "#ffffff", fontWeight: 800 }}>
            <T>Farm Production & Crop Progress</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8" }}>
            <T>Real-time crop stage updates, land cultivation logs, and photo evidence recorded by contracted farmers.</T>
          </p>
        </div>

        {user.role === "farmer" && selectedContract && (
          <button
            type="button"
            onClick={() => setProgressModalContract(selectedContract)}
            className="btn btn-primary"
            style={{ padding: "10px 18px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} /> <T>Log Progress Note</T>
          </button>
        )}
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No active farm progress tracking"
          description="Accepted or active contracts will automatically appear here for real-time progress logging."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
          {/* Contracts Sidebar List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <T>Active Contract Farms</T> ({contracts.length})
            </h3>
            {contracts.map((c) => {
              const isSelected = c._id === selectedContractId;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedContractId(c._id)}
                  style={{
                    background: isSelected ? "#ecfdf5" : "#ffffff",
                    border: `1px solid ${isSelected ? "#059669" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isSelected ? "#065f46" : "#0f172a" }}>
                      <T>{c.cropName}</T>
                    </div>
                    <StatusBadge status={c.status} size="small" />
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {user.role === "farmer" ? <><T>Buyer</T>: {c.buyer?.name || "N/A"}</> : <><T>Farmer</T>: {c.farmer?.name || "N/A"}</>}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>
                    {c.progressUpdates?.length || 0} <T>updates logged</T>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Progress View */}
          {selectedContract && (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}><T>{selectedContract.cropName}</T> <T>Crop Progress</T></h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#64748b" }}>
                    <T>Contract ID</T>: #{selectedContract._id} · <T>Quantity</T>: {selectedContract.quantity} {selectedContract.unit}
                  </p>
                </div>
                <StatusBadge status={selectedContract.status} />
              </div>

              {/* Crop Growth Visual Stages Timeline */}
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#475569", textTransform: "uppercase" }}><T>Crop Stage Timeline</T></h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                  {STAGES.map((st, idx) => {
                    const updateCount = selectedContract.progressUpdates?.length || 0;
                    const isReached = updateCount >= idx || selectedContract.status === "Completed";

                    return (
                      <div
                        key={st}
                        style={{
                          background: isReached ? "#f0fdf4" : "#f8fafc",
                          border: `1px solid ${isReached ? "#bbf7d0" : "#e2e8f0"}`,
                          borderRadius: "8px",
                          padding: "10px 12px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: isReached ? "#10b981" : "#cbd5e1",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            margin: "0 auto 6px auto",
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: isReached ? "#065f46" : "#64748b" }}><T>{st}</T></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Logs Feed */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={16} /> <T>Logged Progress Notes & Evidence</T> ({selectedContract.progressUpdates?.length || 0})
                  </h4>

                  {user.role === "farmer" && (
                    <button
                      type="button"
                      onClick={() => setProgressModalContract(selectedContract)}
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    >
                      + <T>Add Note</T>
                    </button>
                  )}
                </div>

                {(!selectedContract.progressUpdates || selectedContract.progressUpdates.length === 0) ? (
                  <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#64748b" }}>
                    <T>No progress updates logged for this crop yet.</T>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedContract.progressUpdates.map((pu, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          gap: "16px",
                        }}
                      >
                        {pu.image ? (
                          <img
                            src={pu.image.startsWith("http") ? pu.image : `${SERVER_URL}${pu.image}`}
                            alt="Progress log photo"
                            style={{ width: "110px", height: "85px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                          />
                        ) : (
                          <div style={{ width: "110px", height: "85px", borderRadius: "8px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                            <ImageIcon size={24} />
                          </div>
                        )}

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#059669" }}><T>Update</T> #{idx + 1}</span>
                            <span style={{ fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={12} /> {new Date(pu.date).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.5 }}><T>{pu.note}</T></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {progressModalContract && (
        <ProgressModal
          contract={progressModalContract}
          onClose={() => setProgressModalContract(null)}
          onSubmit={handleProgressSubmit}
        />
      )}
    </div>
  );
};

export default FarmProgressCenter;
