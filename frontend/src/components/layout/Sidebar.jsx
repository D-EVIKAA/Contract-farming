import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Sprout,
  FileText,
  BarChart3,
  ShieldAlert,
  History,
  User,
  LogOut,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Shield
} from "lucide-react";
import { T } from "../common/SpeakableWord";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE_URL.replace(/\/api$/, "");

const Sidebar = ({ isCollapsed, toggleSidebar, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role;
  const avatarUrl = user.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${SERVER_URL}${user.profileImage}`
    : null;

  const navItems = [
    {
      title: "Dashboard",
      path: `/${role}`,
      icon: LayoutDashboard,
      roles: ["farmer", "buyer", "admin"],
    },
    {
      title: "Farm Marketplace",
      path: "/marketplace",
      icon: ShoppingBag,
      roles: ["farmer", "buyer", "admin"],
    },
    {
      title: "Farm Progress",
      path: "/progress",
      icon: Sprout,
      roles: ["farmer", "buyer"],
    },
    {
      title: "Smart Insights",
      path: "/insights",
      icon: BarChart3,
      roles: ["farmer", "buyer", "admin"],
    },
    {
      title: "Dispute Center",
      path: "/disputes",
      icon: ShieldAlert,
      roles: ["farmer", "buyer", "admin"],
    },
    {
      title: "Activity Center",
      path: "/activity",
      icon: History,
      roles: ["farmer", "buyer", "admin"],
    },
  ];

  const adminItems = [
    {
      title: "User Management",
      path: "/admin?tab=users",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: "Verification Queue",
      path: "/admin?tab=verification",
      icon: ShieldCheck,
      roles: ["admin"],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      style={{
        width: isCollapsed ? "80px" : "260px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#0f172a",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid #1e293b",
        transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Top Header Logo */}
      <div>
        <div
          style={{
            padding: isCollapsed ? "20px 0" : "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            borderBottom: "1px solid #1e293b",
          }}
        >
          {!isCollapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <Sprout size={22} style={{ color: "#ffffff" }} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "#ffffff" }}>
                  <T>AgriContract</T>
                </span>
                <span style={{ display: "block", fontSize: "0.7rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  SaaS Platform
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sprout size={22} style={{ color: "#ffffff" }} />
            </div>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            style={{
              background: "#1e293b",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: isCollapsed ? "none" : "block",
            }}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              padding: "4px 12px 8px 12px",
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#64748b",
              display: isCollapsed ? "none" : "block",
            }}
          >
            <T>Main Menu</T>
          </div>

          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.path}
                className={({ isActive }) => (isActive ? "nav-link-active" : "nav-link")}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: isCollapsed ? "12px 0" : "10px 14px",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "#94a3b8",
                  background: isActive ? "linear-gradient(90deg, #059669 0%, #10b981 100%)" : "transparent",
                  boxShadow: isActive ? "0 4px 12px rgba(16, 185, 129, 0.25)" : "none",
                  transition: "all 0.2s",
                })}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span><T>{item.title}</T></span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card Footer */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #1e293b", background: "#090d16" }}>
        {!isCollapsed ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #10b981", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#059669",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#10b981", textTransform: "uppercase", fontWeight: 700 }}>
                  <T>{user.role}</T> · <T>{user.verificationStatus || "Pending"}</T>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "6px" }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            style={{ width: "100%", background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", justifyContent: "center" }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
