import { useState } from "react";
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, XCircle, ChevronRight, User, Calendar, Image as ImageIcon } from "lucide-react";
import StatusBadge from "../StatusBadge";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const LIFECYCLE_STAGES = [
  { key: "Pending", label: "Pending Proposal", role: "Buyer", desc: "Contract created and waiting for farmer review." },
  { key: "Accepted", label: "Accepted", role: "Farmer", desc: "Farmer accepted the contract terms." },
  { key: "In Progress", label: "In Progress", role: "Farmer", desc: "Cultivation and farming activities underway." },
  { key: "Ready for Delivery", label: "Ready for Harvest", role: "Farmer", desc: "Crop harvest completed and prepared for dispatch." },
  { key: "Dispatched", label: "Dispatched", role: "Farmer", desc: "Produce in transit to buyer delivery location." },
  { key: "Delivered", label: "Delivered", role: "Buyer", desc: "Buyer received and inspected shipment." },
  { key: "Completed", label: "Completed", role: "Buyer", desc: "Contract fulfilled and closed." },
];

const ContractTimeline = ({ contract }) => {
  const [selectedStage, setSelectedStage] = useState(contract?.status || "Pending");

  if (!contract) return null;

  const isRejectedOrCancelled = ["Rejected", "Cancelled"].includes(contract.status);

  const statusHistory = contract.statusHistory || [];
  const progressUpdates = contract.progressUpdates || [];

  // Determine indices of current active status
  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === contract.status);

  // Find historical timestamp for a given stage key
  const getStageHistoryInfo = (stageKey) => {
    return statusHistory.find((h) => h.status === stageKey);
  };

  const currentSelectedHistory = getStageHistoryInfo(selectedStage);
  const currentSelectedStageMeta = LIFECYCLE_STAGES.find((s) => s.key === selectedStage);

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            Lifecycle Timeline
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            Click any stage node to inspect real timestamp audit logs and evidence
          </p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      {/* Visual Timeline Nodes */}
      {isRejectedOrCancelled ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecdd3", padding: "16px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
          <XCircle size={24} style={{ color: "#ef4444" }} />
          <div>
            <h4 style={{ margin: 0, color: "#9f1239", fontSize: "0.95rem" }}>
              Contract Status: {contract.status}
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#be123c" }}>
              This contract was {contract.status.toLowerCase()} and lifecycle progression has stopped.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: "640px", justifyContent: "space-between", position: "relative" }}>
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isPassed = currentStageIndex >= idx;
              const isCurrent = contract.status === stage.key;
              const isSelected = selectedStage === stage.key;
              const historyItem = getStageHistoryInfo(stage.key);

              return (
                <div
                  key={stage.key}
                  onClick={() => setSelectedStage(stage.key)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 2,
                    flex: 1,
                  }}
                >
                  {/* Connecting Line */}
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        left: "50%",
                        width: "100%",
                        height: "4px",
                        background: currentStageIndex > idx ? "#10b981" : "#e2e8f0",
                        zIndex: 1,
                        transition: "all 0.3s",
                      }}
                    />
                  )}

                  {/* Circle Node */}
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: isCurrent ? "#059669" : isPassed ? "#10b981" : "#ffffff",
                      border: `3px solid ${isCurrent ? "#a7f3d0" : isPassed ? "#10b981" : isSelected ? "#059669" : "#cbd5e1"}`,
                      color: isPassed ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                      boxShadow: isCurrent ? "0 0 0 4px rgba(16, 185, 129, 0.2)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {isPassed ? <CheckCircle2 size={18} /> : <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{idx + 1}</span>}
                  </div>

                  {/* Label */}
                  <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: isSelected || isCurrent ? 700 : 500,
                        color: isCurrent ? "#059669" : isPassed ? "#0f172a" : "#64748b",
                      }}
                    >
                      {stage.label}
                    </div>
                    {historyItem && (
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                        {new Date(historyItem.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Stage Detail Card */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
              Stage Detail: {currentSelectedStageMeta?.label || selectedStage}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "#e2e8f0",
                color: "#334155",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              Responsible Role: {currentSelectedStageMeta?.role || "System"}
            </span>
          </div>

          {currentSelectedHistory ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#059669", fontWeight: 600 }}>
              <Calendar size={14} /> Recorded on: {new Date(currentSelectedHistory.timestamp).toLocaleString("en-IN")}
            </div>
          ) : (
            <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontStyle: "italic" }}>Stage Pending</div>
          )}
        </div>

        <p style={{ margin: 0, fontSize: "0.88rem", color: "#475569" }}>
          {currentSelectedStageMeta?.desc || "No description available for this lifecycle stage."}
        </p>

        {/* Progress Updates evidence list if in In Progress stage */}
        {selectedStage === "In Progress" && progressUpdates.length > 0 && (
          <div style={{ marginTop: "8px", borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
            <h5 style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <ImageIcon size={14} /> Recorded Farmer Crop Updates ({progressUpdates.length})
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {progressUpdates.map((pu, idx) => (
                <div key={idx} style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.78rem" }}>
                    <span>Progress Note #{idx + 1}</span>
                    <span>{new Date(pu.date).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", color: "#0f172a", fontWeight: 500 }}>{pu.note}</p>
                  {pu.image && (
                    <img
                      src={pu.image.startsWith("http") ? pu.image : `${SERVER_URL}${pu.image}`}
                      alt="Farmer crop update evidence"
                      style={{ marginTop: "6px", width: "120px", height: "80px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractTimeline;
