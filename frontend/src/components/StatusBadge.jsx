import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Award,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  DollarSign
} from "lucide-react";

const getStatusConfig = (status) => {
  switch (status) {
    case "Pending":
      return { bg: "#fef3c7", text: "#92400e", border: "#fde68a", icon: Clock };
    case "Accepted":
      return { bg: "#e0f2fe", text: "#075985", border: "#bae6fd", icon: CheckCircle2 };
    case "In Progress":
    case "Under Review":
      return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", icon: RefreshCw };
    case "Ready for Delivery":
      return { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff", icon: PackageCheck };
    case "Dispatched":
      return { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe", icon: Truck };
    case "Delivered":
      return { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0", icon: PackageCheck };
    case "Completed":
    case "Resolved":
    case "Verified":
      return { bg: "#ecfdf5", text: "#047857", border: "#6ee7b7", icon: Award };
    case "Rejected":
    case "Cancelled":
      return { bg: "#ffe4e6", text: "#9f1239", border: "#fecdd3", icon: XCircle };
    case "Initiated":
      return { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa", icon: DollarSign };
    case "Paid":
      return { bg: "#dcfce7", text: "#15803d", border: "#86efac", icon: ShieldCheck };
    case "Open":
      return { bg: "#fef9c3", text: "#854d0e", border: "#fef08a", icon: AlertTriangle };
    default:
      return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0", icon: InfoIcon };
  }
};

const InfoIcon = Clock;

import { T } from "./common/SpeakableWord";

const StatusBadge = ({ status, size = "normal" }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const isSmall = size === "small";

  return (
    <span
      className="inline-flex items-center gap-1.5 font-medium rounded-full transition-all"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        padding: isSmall ? "2px 8px" : "4px 12px",
        fontSize: isSmall ? "0.75rem" : "0.82rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "9999px",
        fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <Icon size={isSmall ? 12 : 14} style={{ flexShrink: 0 }} />
      <span><T>{status || "Unknown"}</T></span>
    </span>
  );
};

export default StatusBadge;
