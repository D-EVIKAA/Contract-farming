const STATUS_CLASS = {
  Pending: "status-pending",
  Accepted: "status-accepted",
  "In Progress": "status-inprogress",
  "Ready for Delivery": "status-ready",
  Dispatched: "status-dispatched",
  Delivered: "status-delivered",
  Completed: "status-completed",
  Rejected: "status-rejected",
  Cancelled: "status-cancelled",
  Initiated: "status-initiated",
  Paid: "status-paid",
  Open: "status-pending",
  "Under Review": "status-inprogress",
  Resolved: "status-completed",
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${STATUS_CLASS[status] || "status-default"}`}>{status}</span>
);

export default StatusBadge;
