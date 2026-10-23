import { useState } from "react";
import StatusBadge from "./StatusBadge";
import ContractTimelineModal from "./ContractTimelineModal";
import PaymentModal from "./PaymentModal";
import { T } from "./common/SpeakableWord";
import {
  Calendar,
  MapPin,
  User,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  CreditCard
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ContractCard = ({
  contract,
  viewerRole = "farmer",
  onAccept,
  onReject,
  onAddProgress,
  onMarkReady,
  onDispatch,
  onConfirmDelivery,
  onComplete,
  onInitiatePayment,
  onConfirmPayment,
  onCancel,
  onRaiseDispute,
  onOpenUserDrawer,
  actionLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const isBusy = actionLoading === contract._id;

  const isFarmerView = viewerRole === "farmer";
  const isBuyerView = viewerRole === "buyer";

  // Action Permissions
  const canFarmerAccept = isFarmerView && contract.status === "Pending";
  const canFarmerReject = isFarmerView && contract.status === "Pending";
  const canFarmerAddProgress = isFarmerView && ["Accepted", "In Progress"].includes(contract.status);
  const canFarmerMarkReady = isFarmerView && contract.status === "In Progress";
  const canFarmerDispatch = isFarmerView && contract.status === "Ready for Delivery";
  const canFarmerConfirmPayment = isFarmerView && contract.paymentStatus === "Initiated";

  const canBuyerConfirmDelivery = isBuyerView && contract.status === "Dispatched";
  const canBuyerComplete = isBuyerView && contract.status === "Delivered";
  const canBuyerPay = isBuyerView && contract.paymentStatus !== "Paid" && !["Rejected", "Cancelled"].includes(contract.status);
  const canBuyerInitiatePayment = isBuyerView && contract.paymentStatus === "Pending" && !["Rejected", "Cancelled"].includes(contract.status);
  const canBuyerCancel = isBuyerView && ["Pending", "Accepted"].includes(contract.status);

  const canRaiseDispute = !!onRaiseDispute && !["Rejected", "Cancelled"].includes(contract.status);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        transition: "all 0.2s ease-in-out",
      }}
    >
      {/* Top Bar Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              <T>{contract.cropName}</T>
            </h3>
            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
              #{contract._id?.slice(-6)}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.88rem", color: "#64748b" }}>
            {contract.quantity} <T>{contract.unit || "Quintals"}</T> · ₹{contract.pricePerUnit}/<T>{contract.unit || "Quintal"}</T>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <StatusBadge status={contract.status} />
          <StatusBadge status={contract.paymentStatus === "Paid" ? "Paid" : contract.paymentStatus === "Initiated" ? "Initiated" : "Pending"} size="small" />
        </div>
      </div>

      {/* Grid Meta Information */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #f1f5f9", fontSize: "0.85rem" }}>
        <div>
          <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Agreed Contract Value</T></span>
          <div style={{ fontWeight: 700, color: "#059669", fontSize: "1rem" }}>
            ₹{Number(contract.totalAmount || 0).toLocaleString("en-IN")}
          </div>
        </div>

        <div>
          <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Expected Delivery</T></span>
          <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
            <Calendar size={14} style={{ color: "#64748b" }} /> {formatDate(contract.expectedDeliveryDate)}
          </div>
        </div>

        <div>
          <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Location</T></span>
          <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
            <MapPin size={14} style={{ color: "#64748b" }} /> <T>{contract.location}</T>
          </div>
        </div>

        <div>
          <span style={{ color: "#64748b", fontSize: "0.78rem" }}>
            <T>{isBuyerView ? "Assigned Farmer" : "Purchasing Buyer"}</T>
          </span>
          <div
            onClick={() => {
              if (onOpenUserDrawer) {
                onOpenUserDrawer(isBuyerView ? contract.farmer : contract.buyer);
              }
            }}
            style={{ fontWeight: 600, color: "#0284c7", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", marginTop: "2px" }}
          >
            <User size={14} /> <T>{isBuyerView ? contract.farmer?.name || "Unassigned" : contract.buyer?.name || "Buyer"}</T>
          </div>
        </div>
      </div>

      {/* Action Toggle Links */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{ background: "none", border: "none", color: "#059669", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <T>{expanded ? "Hide Details & Audit" : "View Full Details & Evidence"}</T>
        </button>

        <button
          type="button"
          onClick={() => setShowTimeline(true)}
          style={{ background: "none", border: "none", color: "#475569", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
        >
          <Clock size={15} /> <T>Visual Timeline</T>
        </button>
      </div>

      {/* Expandable Details Section */}
      {expanded && (
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
          <div>
            <strong style={{ color: "#475569" }}>Additional Requirements:</strong>{" "}
            <span style={{ color: "#0f172a" }}>{contract.additionalRequirements || "None specified"}</span>
          </div>

          {/* Progress Logs */}
          <div>
            <strong style={{ color: "#475569", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <ImageIcon size={16} /> Production Progress Updates ({contract.progressUpdates?.length || 0})
            </strong>
            {contract.progressUpdates && contract.progressUpdates.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {contract.progressUpdates.map((entry, idx) => (
                  <div key={idx} style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.78rem" }}>
                      <span>Update #{idx + 1}</span>
                      <span>{formatDate(entry.date)}</span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", color: "#0f172a", fontWeight: 500 }}>{entry.note}</p>
                    {entry.image && (
                      <img
                        src={entry.image.startsWith("http") ? entry.image : `${SERVER_URL}${entry.image}`}
                        alt="Progress evidence"
                        style={{ marginTop: "6px", width: "100px", height: "70px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>No crop progress logs recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "6px" }}>
        {canFarmerAccept && (
          <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => onAccept(contract._id)}>
            {isBusy ? <T>Processing...</T> : <>✓ <T>Accept</T></>}
          </button>
        )}

        {canFarmerReject && (
          <button type="button" className="btn btn-outline-danger" disabled={isBusy} onClick={() => onReject(contract._id)}>
            ✕ <T>Reject</T>
          </button>
        )}

        {canFarmerAddProgress && (
          <button type="button" className="btn btn-outline" disabled={isBusy} onClick={() => onAddProgress(contract)}>
            + <T>Log Farm Progress</T>
          </button>
        )}

        {canFarmerMarkReady && (
          <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => onMarkReady(contract._id)}>
            {isBusy ? <T>Processing...</T> : <T>Mark Ready for Delivery</T>}
          </button>
        )}

        {canFarmerDispatch && (
          <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => onDispatch(contract._id)}>
            {isBusy ? <T>Processing...</T> : <T>Dispatch Crop</T>}
          </button>
        )}

        {canFarmerConfirmPayment && (
          <button type="button" className="btn btn-success" disabled={isBusy} onClick={() => onConfirmPayment(contract._id)}>
            {isBusy ? <T>Processing...</T> : <>✓ <T>Confirm Payment</T></>}
          </button>
        )}

        {canBuyerConfirmDelivery && (
          <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => onConfirmDelivery(contract._id)}>
            {isBusy ? <T>Processing...</T> : <T>Confirm Delivery</T>}
          </button>
        )}

        {canBuyerComplete && (
          <button type="button" className="btn btn-success" disabled={isBusy} onClick={() => onComplete(contract._id)}>
            {isBusy ? <T>Processing...</T> : <T>Completed</T>}
          </button>
        )}

        {canBuyerPay && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => setShowPaymentModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              borderColor: "#059669",
              boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
            }}
          >
            <CreditCard size={15} /> <T>Pay Now</T> (₹{Number(contract.totalAmount || 0).toLocaleString("en-IN")})
          </button>
        )}

        {canBuyerCancel && (
          <button type="button" className="btn btn-outline-danger" disabled={isBusy} onClick={() => onCancel(contract._id)}>
            <T>Cancel</T>
          </button>
        )}

        {canRaiseDispute && (
          <button type="button" className="btn btn-sm btn-outline" disabled={isBusy} onClick={() => onRaiseDispute(contract)}>
            <ShieldAlert size={14} /> <T>Raise Dispute</T>
          </button>
        )}
      </div>

      <ContractTimelineModal
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
        contract={contract}
      />

      {showPaymentModal && (
        <PaymentModal
          contract={contract}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            if (onInitiatePayment) onInitiatePayment(contract._id);
          }}
        />
      )}
    </div>
  );
};

export default ContractCard;
