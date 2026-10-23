import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getContracts } from "../../services/contractService";
import { getDisputes } from "../../services/disputeService";
import { History, FileText, ShieldAlert, CheckCircle2, User, Clock, ArrowRight } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonTable } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const ActivityCenter = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [contracts, setContracts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContracts().catch(() => []),
      getDisputes().catch(() => []),
    ])
      .then(([cData, dData]) => {
        setContracts(cData || []);
        setDisputes(dData || []);
      })
      .catch(() => toast.error("Could not load activity history."))
      .finally(() => setLoading(false));
  }, []);

  // Consolidate real audit entries from contract statusHistory, disputes, and contract creations
  const activityLogs = useMemo(() => {
    const logs = [];

    contracts.forEach((c) => {
      // Contract Creation Event
      logs.push({
        id: `create-${c._id}`,
        title: `New Contract Created: ${c.cropName}`,
        type: "contract_created",
        details: `Quantity: ${c.quantity} ${c.unit} · Agreed Price: ₹${c.totalAmount?.toLocaleString("en-IN")}`,
        timestamp: c.createdAt || Date.now(),
        contractId: c._id,
        status: c.status,
      });

      // Status History Events
      if (c.statusHistory && c.statusHistory.length > 0) {
        c.statusHistory.forEach((sh, idx) => {
          logs.push({
            id: `sh-${c._id}-${idx}`,
            title: `Contract Status Updated to '${sh.status}'`,
            type: "status_change",
            details: `Crop: ${c.cropName} (ID: #${c._id})`,
            timestamp: sh.timestamp,
            contractId: c._id,
            status: sh.status,
          });
        });
      }
    });

    disputes.forEach((d) => {
      logs.push({
        id: `dispute-${d._id}`,
        title: `Dispute Filed: ${d.title}`,
        type: "dispute_event",
        details: `Contract: ${d.contract?.cropName || d.contract} · Status: ${d.status}`,
        timestamp: d.createdAt || Date.now(),
        status: d.status,
      });
    });

    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [contracts, disputes]);

  if (loading) return <SkeletonTable />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
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
            <History size={14} /> <T>Audit Trail</T>
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.7rem", color: "#ffffff", fontWeight: 800 }}>
            <T>System Activity & Audit Log</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", opacity: 0.9 }}>
            <T>Chronological audit log of contract state transitions, dispute events, and verification actions.</T>
          </p>
        </div>
      </div>

      {activityLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity logs recorded yet"
          description="System activity will populate here as contracts and status updates are performed."
        />
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {activityLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  gap: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #f1f5f9",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: log.type === "dispute_event" ? "#fef2f2" : "#f0fdf4",
                    color: log.type === "dispute_event" ? "#ef4444" : "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {log.type === "dispute_event" ? <ShieldAlert size={18} /> : <FileText size={18} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}><T>{log.title}</T></h4>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {new Date(log.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#475569" }}><T>{log.details}</T></p>
                </div>

                <StatusBadge status={log.status} size="small" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCenter;
