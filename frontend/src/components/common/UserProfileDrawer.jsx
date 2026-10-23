import { X, Phone, Mail, MapPin, ShieldCheck, ShieldAlert, Award, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { T } from "./SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const UserProfileDrawer = ({ user, isOpen, onClose, contracts = [], onRequestContract }) => {
  const { user: currentUser } = useAuth();
  if (!isOpen || !user) return null;

  const isFarmer = user.role === "farmer";
  const canPropose = currentUser?.role === "buyer" && isFarmer;
  const avatarUrl = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  const userContracts = contracts.filter(
    (c) =>
      (c.farmer?._id === user._id || c.farmer === user._id || c.buyer?._id === user._id || c.buyer === user._id)
  );

  const activeContracts = userContracts.filter((c) =>
    ["Accepted", "In Progress", "Ready for Delivery", "Dispatched"].includes(c.status)
  );

  const photos = isFarmer
    ? user.farmDetails?.farmPhotos || []
    : user.businessPhotos || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          transition: "opacity 0.2s",
        }}
      />

      {/* Side Drawer Content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          background: "#ffffff",
          boxShadow: "-10px 0 25px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase" }}>
              <T>User Profile & Verification</T>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", borderRadius: "6px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Body */}
        <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* User Hero Info */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid #10b981" }}
              />
            ) : (
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#059669",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", color: "#0f172a" }}>{user.name}</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: user.role === "farmer" ? "#dcfce7" : "#e0f2fe",
                    color: user.role === "farmer" ? "#15803d" : "#0369a1",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  <T>{user.role}</T>
                </span>
                <StatusBadge status={user.verificationStatus || "Pending"} size="small" />
              </div>

              {/* Aadhaar Badge */}
              <div style={{ marginTop: "6px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: user.aadhaarVerified ? "#15803d" : "#b45309" }}>
                {user.aadhaarVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span>
                  {user.aadhaarVerified ? (
                    <><T>Aadhaar Verified</T> (XXXX-XXXX-{user.aadhaarLast4 || "XXXX"})</>
                  ) : (
                    <T>Identity Verification Pending</T>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#475569", textTransform: "uppercase" }}><T>Contact Info</T></h4>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "#334155" }}>
              <Mail size={16} style={{ color: "#64748b" }} />
              <span>{user.email}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "#334155" }}>
              <Phone size={16} style={{ color: "#64748b" }} />
              <span>{user.phone || <T>Phone not provided</T>}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "#334155" }}>
              <MapPin size={16} style={{ color: "#64748b" }} />
              <span>{user.address || user.farmDetails?.location || <T>Location not provided</T>}</span>
            </div>
          </div>

          {/* Farm or Business Information */}
          {isFarmer ? (
            <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                🌾 <T>Farm Overview</T>
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.88rem" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Farm Size</T></span>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{user.farmDetails?.farmSize || "N/A"}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Soil Type</T></span>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{user.farmDetails?.soilType || "N/A"}</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Crops Grown</T></span>
                  <div style={{ fontWeight: 600, color: "#059669" }}>{user.farmDetails?.cropsGrown || "N/A"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                🏢 <T>Business Overview</T>
              </h4>
              <div>
                <span style={{ color: "#64748b", fontSize: "0.78rem" }}><T>Business Name</T></span>
                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "1rem" }}>{user.businessName || "Not specified"}</div>
              </div>
            </div>
          )}

          {/* Photos Gallery */}
          {photos.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <ImageIcon size={16} /> <T>Photos Evidence</T> ({photos.length})
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {photos.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.startsWith("http") ? p : `${SERVER_URL}${p}`}
                    alt="Gallery item"
                    style={{ width: "100%", height: "90px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Contracts Summary */}
          <div>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={16} /> <T>Contract Activity</T> ({userContracts.length} <T>Total</T>, {activeContracts.length} <T>Active</T>)
            </h4>
            {userContracts.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}><T>No contracts recorded yet.</T></p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {userContracts.slice(0, 3).map((c) => (
                  <div
                    key={c._id}
                    style={{
                      background: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#0f172a" }}><T>{c.cropName}</T></div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {c.quantity} {c.unit} · ₹{(c.totalAmount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <StatusBadge status={c.status} size="small" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {onRequestContract && canPropose && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestContract(user);
              }}
              className="btn btn-primary btn-block"
              style={{ padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              + <T>Propose Contract to</T> {user.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileDrawer;
