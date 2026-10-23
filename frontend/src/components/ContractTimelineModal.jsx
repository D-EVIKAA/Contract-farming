import { T } from "./common/SpeakableWord";

const LIFECYCLE_STEPS = [
  { statusKey: "Pending", title: "Contract Proposed", desc: "Buyer created the contract proposal" },
  { statusKey: "Accepted", title: "Proposal Accepted", desc: "Farmer accepted the contract terms" },
  { statusKey: "In Progress", title: "Crop Production", desc: "Farmer recorded crop cultivation progress" },
  { statusKey: "Ready for Delivery", title: "Harvest Ready", desc: "Farmer marked crop ready for shipment" },
  { statusKey: "Dispatched", title: "Crop Dispatched", desc: "Farmer dispatched goods to buyer" },
  { statusKey: "Delivered", title: "Delivery Confirmed", desc: "Buyer verified & confirmed receipt of goods" },
  { statusKey: "Completed", title: "Contract Completed", desc: "Contract successfully finalized" },
  { statusKey: "Paid", title: "Payment Settled", desc: "Farmer confirmed receipt of payment" },
];

const ContractTimelineModal = ({ isOpen, onClose, contract }) => {
  if (!isOpen || !contract) return null;

  const history = contract.statusHistory || [];
  
  // Find timestamp for a given status in history
  const getHistoryEntry = (statusKey) => {
    if (statusKey === "Paid" && contract.paymentStatus === "Paid") {
      const paidEntry = history.slice().reverse().find((h) => h.status === "Paid" || h.status === "Payment Confirmed");
      if (paidEntry) return paidEntry;
    }
    return history.find((h) => h.status === statusKey);
  };

  // Determine current active status index
  const getCurrentStepIndex = () => {
    let currentIdx = -1;
    LIFECYCLE_STEPS.forEach((step, idx) => {
      if (getHistoryEntry(step.statusKey) || contract.status === step.statusKey) {
        currentIdx = idx;
      }
    });
    if (contract.paymentStatus === "Paid") {
      currentIdx = LIFECYCLE_STEPS.length - 1;
    }
    return currentIdx;
  };

  const currentStepIdx = getCurrentStepIndex();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "90%", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>📜 <T>Contract Timeline</T></h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <T>ID</T>: {contract._id?.slice(-8)} · <T>Crop</T>: <strong><T>{contract.cropName}</T></strong>
            </span>
          </div>
          <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }} onClick={onClose}>
            ✕ <T>Close</T>
          </button>
        </div>

        {contract.status === "Rejected" || contract.status === "Cancelled" ? (
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            <T>This contract was</T> <strong><T>{contract.status}</T></strong>.
          </div>
        ) : null}

        <div className="timeline-container" style={{ position: "relative", paddingLeft: "1.5rem", margin: "1rem 0" }}>
          {/* Vertical timeline connector line */}
          <div
            style={{
              position: "absolute",
              left: "0.6rem",
              top: "0.5rem",
              bottom: "0.5rem",
              width: "2px",
              backgroundColor: "var(--border-color)",
            }}
          />

          {LIFECYCLE_STEPS.map((step, idx) => {
            const historyItem = getHistoryEntry(step.statusKey);
            const isCompleted = !!historyItem || idx <= currentStepIdx;
            const isCurrent = contract.status === step.statusKey || (step.statusKey === "Paid" && contract.paymentStatus === "Paid");

            return (
              <div
                key={step.statusKey}
                style={{
                  position: "relative",
                  marginBottom: "1.25rem",
                  paddingBottom: "0.25rem",
                }}
              >
                {/* Step Marker Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-1.5rem",
                    top: "0.2rem",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: isCurrent
                      ? "var(--primary-color)"
                      : isCompleted
                      ? "#10b981"
                      : "var(--bg-card)",
                    border: isCompleted || isCurrent ? "2px solid #fff" : "2px solid var(--border-color)",
                    boxShadow: isCurrent ? "0 0 0 3px rgba(37, 99, 235, 0.3)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    color: "#fff",
                    fontWeight: "bold",
                    zIndex: 2,
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>

                {/* Step Content */}
                <div
                  style={{
                    background: isCurrent ? "rgba(37, 99, 235, 0.06)" : "transparent",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: isCurrent ? "1px solid var(--primary-color)" : "1px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontWeight: isCurrent || isCompleted ? 600 : 400,
                        color: isCompleted ? "var(--text-primary)" : "var(--text-secondary)",
                        fontSize: "0.95rem",
                      }}
                    >
                      <T>{step.title}</T>
                    </span>
                    {historyItem?.timestamp && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(historyItem.timestamp).toLocaleDateString()}{" "}
                        {new Date(historyItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                    <T>{step.desc}</T>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContractTimelineModal;
