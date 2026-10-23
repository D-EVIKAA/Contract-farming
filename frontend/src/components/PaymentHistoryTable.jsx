import { useState, useMemo } from "react";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { T } from "./common/SpeakableWord";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PaymentHistoryTable = ({ payments = [], viewerRole = "buyer" }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.orderId?.toLowerCase().includes(q) ||
        p.paymentId?.toLowerCase().includes(q) ||
        p.contract?.cropName?.toLowerCase().includes(q) ||
        p.buyer?.name?.toLowerCase().includes(q) ||
        p.farmer?.name?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [payments, statusFilter, search]);

  const totalSuccessful = useMemo(() => {
    return payments
      .filter((p) => p.status === "Successful")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "8px 12px",
            minWidth: "260px",
            flex: 1,
          }}
        >
          <Search size={16} style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search by Txn ID, Order ID, crop, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              background: "transparent",
              fontSize: "0.88rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {["All", "Successful", "Pending", "Failed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid",
                borderColor: statusFilter === st ? "#059669" : "#e2e8f0",
                background: statusFilter === st ? "#ecfdf5" : "#ffffff",
                color: statusFilter === st ? "#065f46" : "#475569",
                cursor: "pointer",
              }}
            >
              <T>{st}</T>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.9rem",
          }}
        >
          <T>No payment transactions found matching the filter.</T>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Transaction Ref / Order</T></th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Contract Crop</T></th>
                  {viewerRole === "admin" && (
                    <>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Buyer</T></th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Farmer</T></th>
                    </>
                  )}
                  {viewerRole === "buyer" && <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Beneficiary</T></th>}
                  {viewerRole === "farmer" && <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Sender</T></th>}
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Amount</T></th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Method</T></th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Status</T></th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}><T>Date</T></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isSuccess = p.status === "Successful";
                  const isFailed = p.status === "Failed" || p.status === "Cancelled";

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {p.paymentId || p.orderId?.slice(0, 16) + "..."}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          Order: {p.orderId?.slice(-10)}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#059669" }}>
                          {p.contract?.cropName || "Contract Produce"}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          #{p.contract?._id?.slice(-6) || "N/A"}
                        </span>
                      </td>

                      {viewerRole === "admin" && (
                        <>
                          <td style={{ padding: "12px 16px" }}>{p.buyer?.name || "Buyer"}</td>
                          <td style={{ padding: "12px 16px" }}>{p.farmer?.name || "Farmer"}</td>
                        </>
                      )}

                      {viewerRole === "buyer" && (
                        <td style={{ padding: "12px 16px" }}>{p.farmer?.name || "Farmer"}</td>
                      )}
                      {viewerRole === "farmer" && (
                        <td style={{ padding: "12px 16px" }}>{p.buyer?.name || "Buyer"}</td>
                      )}

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 800, color: isSuccess ? "#059669" : "#0f172a" }}>
                          ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{p.currency || "INR"}</span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {p.paymentMethod || "UPI"}
                        </span>
                        {p.upiDetails?.vpa && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                            {p.upiDetails.vpa}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isSuccess ? "#dcfce7" : isFailed ? "#fee2e2" : "#fef3c7",
                            color: isSuccess ? "#15803d" : isFailed ? "#b91c1c" : "#b45309",
                          }}
                        >
                          {isSuccess && <CheckCircle2 size={12} />}
                          {isFailed && <AlertCircle size={12} />}
                          {!isSuccess && !isFailed && <Clock size={12} />}
                          {p.status}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.8rem" }}>
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryTable;
