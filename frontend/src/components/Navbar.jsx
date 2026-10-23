import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUnreadCount } from "../services/notificationService";
import NotificationPanel from "./NotificationPanel";

const roleToPath = { farmer: "/farmer", buyer: "/buyer", admin: "/admin" };

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      // ignore background error silently
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="navbar">
        <Link to="/" className="navbar-brand">
          Contract Farming
        </Link>

        <nav className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <Link to={roleToPath[user.role] || "/"}>Dashboard</Link>
              
              <button
                type="button"
                className="btn btn-outline"
                style={{ position: "relative", padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                onClick={() => setIsNotifOpen(true)}
              >
                <span>🔔</span>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "999px",
                      padding: "0.1rem 0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              <span className="navbar-user">
                {user.name} · {user.role}
              </span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <NotificationPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onUnreadCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
};

export default Navbar;
