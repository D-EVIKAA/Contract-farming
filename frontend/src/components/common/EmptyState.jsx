import { Inbox } from "lucide-react";
import { T } from "./SpeakableWord";

const EmptyState = ({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are no records matching your request at this time.",
  actionLabel,
  onAction,
}) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px dashed #cbd5e1",
      borderRadius: "12px",
      padding: "40px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      margin: "16px 0",
    }}
  >
    <div
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "#f1f5f9",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={28} />
    </div>
    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a", fontWeight: 600 }}>
      <T>{title}</T>
    </h3>
    <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", maxWidth: "400px" }}>
      <T>{description}</T>
    </p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="btn btn-primary"
        style={{ marginTop: "8px", fontSize: "0.88rem" }}
      >
        <T>{actionLabel}</T>
      </button>
    )}
  </div>
);

export default EmptyState;
