import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { getContracts } from "../../services/contractService";
import { getAllUsers, getVerificationUsers } from "../../services/userService";
import { getDisputes } from "../../services/disputeService";
import { getSystemStats } from "../../services/adminService";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, ShieldCheck, DollarSign, FileText, Users } from "lucide-react";
import { SkeletonStats } from "../../components/common/SkeletonLoader";
import { useToast } from "../../context/ToastContext";
import { T } from "../../components/common/SpeakableWord";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#64748b"];

const SmartInsights = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContracts().catch(() => []),
      getAllUsers().catch(() => []),
      getDisputes().catch(() => []),
    ])
      .then(([cData, uData, dData]) => {
        setContracts(cData || []);
        setUsers(uData || []);
        setDisputes(dData || []);
      })
      .catch(() => toast.error("Failed to load insights data."))
      .finally(() => setLoading(false));
  }, []);

  // Calculate REAL stats and data distributions
  const statusDistributionData = useMemo(() => {
    const counts = {};
    contracts.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  }, [contracts]);

  const paymentStatusData = useMemo(() => {
    const counts = { Pending: 0, Initiated: 0, Confirmed: 0, Paid: 0 };
    contracts.forEach((c) => {
      const ps = c.paymentStatus || "Pending";
      counts[ps] = (counts[ps] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      count: counts[key],
    }));
  }, [contracts]);

  const financialOverview = useMemo(() => {
    const totalAgreed = contracts.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    const totalPaid = contracts
      .filter((c) => c.paymentStatus === "Paid")
      .reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    const totalPending = contracts
      .filter((c) => c.paymentStatus !== "Paid")
      .reduce((acc, c) => acc + (c.totalAmount || 0), 0);

    return { totalAgreed, totalPaid, totalPending };
  }, [contracts]);

  const verificationStatsData = useMemo(() => {
    const counts = { Verified: 0, Pending: 0, Rejected: 0 };
    users.forEach((u) => {
      const st = u.verificationStatus || "Pending";
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      users: counts[key],
    }));
  }, [users]);

  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "16px",
          padding: "28px 24px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
            <BarChart3 size={14} /> <T>Real Data Analytics</T>
          </div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "1.7rem", color: "#ffffff", fontWeight: 800 }}>
            <T>Smart Insights & Network Analytics</T>
          </h1>
          <p style={{ margin: 0, fontSize: "0.92rem", color: "#94a3b8" }}>
            <T>Calculated metrics, contract status distributions, and financial analytics derived strictly from real database records.</T>
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Contracts</T></div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{contracts.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#10b981", marginTop: "4px" }}><T>Active system agreements</T></div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Total Contract Value</T></div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
            ₹{financialOverview.totalAgreed.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}><T>Agreed contract value</T></div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #059669" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>Settled Payments</T></div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
            ₹{financialOverview.totalPaid.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#059669", marginTop: "4px" }}><T>Confirmed farmer payouts</T></div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}><T>System Disputes</T></div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>{disputes.length}</div>
          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}><T>Logged contract disputes</T></div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Contract Status Pie Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>
            <T>Contract Status Distribution</T>
          </h3>
          {statusDistributionData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><T>No contracts available for breakdown.</T></div>
          ) : (
            <div style={{ width: "100%", height: "260px" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Status Bar Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>
            <T>Payment Settlement Stages</T>
          </h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <BarChart data={paymentStatusData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Status Distribution (Admin/System) */}
        {users.length > 0 && (
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", gridColumn: "span 2" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>
              <T>User Verification Statistics</T>
            </h3>
            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer>
                <BarChart data={verificationStatsData} layout="vertical">
                  <XAxis type="number" allowDecimals={false} stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInsights;
