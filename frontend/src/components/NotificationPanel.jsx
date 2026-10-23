import { useState, useEffect } from "react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      if (onUnreadCountChange) {
        onUnreadCountChange(data.unreadCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (onUnreadCountChange) {
        setNotifications((latest) => {
          const count = latest.filter((n) => !n.isRead).length;
          onUnreadCountChange(count);
          return latest;
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error marking all as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => {
        const updated = prev.filter((n) => n._id !== id);
        if (onUnreadCountChange) {
          const count = updated.filter((n) => !n.isRead).length;
          onUnreadCountChange(count);
        }
        return updated;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting notification");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content notification-panel-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", width: "90%", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem" }}>🔔 Notifications</h3>
          <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {notifications.filter((n) => !n.isRead).length} unread
          </span>
          {notifications.some((n) => !n.isRead) && (
            <button
              className="btn btn-secondary"
              style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No notifications yet.</div>
        ) : (
          <div className="notification-list" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: "0.85rem",
                  borderRadius: "8px",
                  backgroundColor: n.isRead ? "var(--bg-card)" : "rgba(37, 99, 235, 0.08)",
                  border: n.isRead ? "1px solid var(--border-color)" : "1px solid var(--primary-color)",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "var(--primary-color)",
                      color: "#fff",
                    }}
                  >
                    {n.type || "INFO"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontWeight: 600, marginTop: "0.4rem", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {n.title}
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {n.message}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.6rem" }}>
                  {!n.isRead && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                      onClick={() => handleMarkRead(n._id)}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                    onClick={() => handleDelete(n._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
