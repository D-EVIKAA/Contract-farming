import { useState } from "react";
import StatusBadge from "./StatusBadge";

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
  actionLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isBusy = actionLoading === contract._id;

  // Permissions based on Role and Status
  const isFarmerView = viewerRole === "farmer";
  const isBuyerView = viewerRole === "buyer";

  // Farmer Action Permissions
  const canFarmerAccept = isFarmerView && contract.status === "Pending";
  const canFarmerReject = isFarmerView && contract.status === "Pending";
  const canFarmerAddProgress = isFarmerView && ["Accepted", "In Progress"].includes(contract.status);
  const canFarmerMarkReady = isFarmerView && contract.status === "In Progress";
  const canFarmerDispatch = isFarmerView && contract.status === "Ready for Delivery";
  const canFarmerConfirmPayment = isFarmerView && contract.paymentStatus === "Initiated";

  // Buyer Action Permissions
  const canBuyerConfirmDelivery = isBuyerView && contract.status === "Dispatched";
  const canBuyerComplete = isBuyerView && contract.status === "Delivered";
  const canBuyerInitiatePayment = isBuyerView && contract.paymentStatus === "Pending" && !["Rejected", "Cancelled"].includes(contract.status);
  const canBuyerCancel = isBuyerView && ["Pending", "Accepted"].includes(contract.status);

  // Dispute Permission (Buyer or Farmer on active contracts)
  const canRaiseDispute = !!onRaiseDispute && !["Rejected", "Cancelled"].includes(contract.status);

  return (
    <div className="contract-card">
      <div className="contract-card-header">
        <div>
          <h3>{contract.cropName}</h3>
          <p className="contract-card-meta">
            {contract.quantity} {contract.unit} · ₹{contract.pricePerUnit}/{contract.unit}
          </p>
        </div>
        <div className="status-badges-group">
          <StatusBadge status={contract.status} />
          <StatusBadge status={contract.paymentStatus === "Paid" ? "Paid" : contract.paymentStatus === "Initiated" ? "Initiated" : "Payment Pending"} />
        </div>
      </div>

      <div className="contract-card-grid">
        <div>
          <span className="label">Total Amount</span>
          <span className="amount-value">₹{Number(contract.totalAmount || 0).toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span className="label">Delivery By</span>
          <span>{formatDate(contract.expectedDeliveryDate)}</span>
        </div>
        <div>
          <span className="label">Location</span>
          <span>{contract.location}</span>
        </div>
        {isBuyerView ? (
          <div>
            <span className="label">Assigned Farmer</span>
            <span>{contract.farmer?.name || "Unassigned"} ({contract.farmer?.phone || "N/A"})</span>
          </div>
        ) : (
          <div>
            <span className="label">Buyer</span>
            <span>
              {contract.buyer?.name || "—"}
              {contract.buyer?.businessName ? ` (${contract.buyer.businessName})` : ""}
            </span>
          </div>
        )}
      </div>

      <button type="button" className="link-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide details" : "View details"}
      </button>

      {expanded && (
        <div className="contract-card-details">
          <p>
            <span className="label">Contract ID:</span> {contract._id}
          </p>
          <p>
            <span className="label">Additional Requirements:</span>{" "}
            {contract.additionalRequirements || "None"}
          </p>
          <p>
            <span className="label">Payment Status:</span> <strong>{contract.paymentStatus}</strong>
          </p>
          <p>
            <span className="label">Created Date:</span> {formatDate(contract.createdAt)}
          </p>

          <div className="progress-log">
            <span className="label">Crop Progress Log & Evidence:</span>
            {contract.progressUpdates && contract.progressUpdates.length > 0 ? (
              <ul className="progress-list">
                {contract.progressUpdates.map((entry, idx) => (
                  <li key={idx} className="progress-item">
                    <div className="progress-item-header">
                      <strong>{formatDate(entry.date)}:</strong> {entry.note}
                    </div>
                    {entry.image && (
                      <div className="progress-img-container">
                        <img
                          src={entry.image.startsWith("http") ? entry.image : `${SERVER_URL}${entry.image}`}
                          alt="Progress evidence"
                          className="progress-evidence-img"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">No progress updates logged yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="contract-card-actions">
        {/* Farmer Workflow Buttons */}
        {canFarmerAccept && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onAccept(contract._id)}
          >
            {isBusy ? "Processing..." : "Accept Proposal"}
          </button>
        )}

        {canFarmerReject && (
          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={isBusy}
            onClick={() => onReject(contract._id)}
          >
            Reject Proposal
          </button>
        )}

        {canFarmerAddProgress && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={isBusy}
            onClick={() => onAddProgress(contract)}
          >
            Add Progress Update
          </button>
        )}

        {canFarmerMarkReady && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onMarkReady(contract._id)}
          >
            {isBusy ? "Processing..." : "Mark Ready for Delivery"}
          </button>
        )}

        {canFarmerDispatch && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onDispatch(contract._id)}
          >
            {isBusy ? "Processing..." : "Dispatch Crop"}
          </button>
        )}

        {canFarmerConfirmPayment && (
          <button
            type="button"
            className="btn btn-success"
            disabled={isBusy}
            onClick={() => onConfirmPayment(contract._id)}
          >
            {isBusy ? "Processing..." : "Confirm Payment Received"}
          </button>
        )}

        {/* Buyer Workflow Buttons */}
        {canBuyerConfirmDelivery && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onConfirmDelivery(contract._id)}
          >
            {isBusy ? "Processing..." : "Confirm Delivery Received"}
          </button>
        )}

        {canBuyerComplete && (
          <button
            type="button"
            className="btn btn-success"
            disabled={isBusy}
            onClick={() => onComplete(contract._id)}
          >
            {isBusy ? "Processing..." : "Complete Contract"}
          </button>
        )}

        {canBuyerInitiatePayment && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onInitiatePayment(contract._id)}
          >
            {isBusy ? "Processing..." : "Initiate Payment"}
          </button>
        )}

        {canBuyerCancel && (
          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={isBusy}
            onClick={() => onCancel(contract._id)}
          >
            Cancel Contract
          </button>
        )}

        {/* Dispute Trigger */}
        {canRaiseDispute && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            disabled={isBusy}
            onClick={() => onRaiseDispute(contract)}
          >
            Raise Dispute
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractCard;
