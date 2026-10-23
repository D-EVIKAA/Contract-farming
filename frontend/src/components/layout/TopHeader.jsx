import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Search, Bell, Plus, ShieldCheck, ShieldAlert, User, Menu, Sprout, ShoppingBag } from "lucide-react";
import { getUnreadCount } from "../../services/notificationService";
import { LanguageSelector, T } from "../common/SpeakableWord";

const TopHeader = ({ onOpenSearch, onOpenNotifications, onOpenQuickAction, onOpenProfile, toggleMobileSidebar }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadCount()
        .then((count) => setUnreadCount(count || 0))
        .catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  return (
    <header
      style={{
        height: "64px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 90,
      }}
    >
      {/* Mobile Toggle & Search Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, maxWidth: "480px" }}>
        <button
          type="button"
          onClick={toggleMobileSidebar}
          style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex", padding: "4px" }}
          className="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>

        <div
          onClick={onOpenSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s",
          }}
        >
          <Search size={18} style={{ color: "#64748b" }} />
          <span style={{ fontSize: "0.88rem", color: "#94a3b8" }}>
            <T>Search contracts, farmers, products...</T>
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.72rem", background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
            Ctrl + K
          </span>
        </div>
      </div>

      {/* Right Action Icons, Language Switcher & Profile Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Language Selector */}
        <LanguageSelector />

        {/* Verification Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: user.verificationStatus === "Verified" ? "#f0fdf4" : "#fefce8",
            border: `1px solid ${user.verificationStatus === "Verified" ? "#bbf7d0" : "#fef08a"}`,
            fontSize: "0.78rem",
            fontWeight: 600,
            color: user.verificationStatus === "Verified" ? "#166534" : "#854d0e",
          }}
        >
          {user.verificationStatus === "Verified" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          <span><T>{user.verificationStatus || "Pending Verification"}</T></span>
        </div>

        {/* Quick Action Button */}
        {user.role === "buyer" && (
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="btn btn-primary"
            style={{ padding: "6px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> <T>New Contract</T>
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            position: "relative",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
            cursor: "pointer",
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#ef4444",
                color: "#ffffff",
                fontSize: "0.7rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #ffffff",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
