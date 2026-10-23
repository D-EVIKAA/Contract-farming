import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Trash2, X, AlertCircle, FileText, ShieldAlert } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notificationService";
import { T } from "./SpeakableWord";

const NotificationDrawer = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res?.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", justifyContent: "flex-end" }}>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(3px)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          height: "100%",
          background: "#ffffff",
          boxShadow: "-10px 0 25px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={20} style={{ color: "#059669" }} />
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}><T>Notification Center</T></h3>
            {unreadCount > 0 && (
              <span style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" }}>
                {unreadCount}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                background: filter === "all" ? "#0f172a" : "#f1f5f9",
                color: filter === "all" ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              <T>All</T> ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                background: filter === "unread" ? "#0f172a" : "#f1f5f9",
                color: filter === "unread" ? "#ffffff" : "#475569",
                cursor: "pointer",
              }}
            >
              <T>Unread</T> ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{ background: "none", border: "none", color: "#059669", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <CheckCheck size={14} /> <T>Mark all read</T>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}><T>Loading notifications...</T></div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <Bell size={32} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "0.9rem" }}><T>No notifications available.</T></p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    background: n.isRead ? "#ffffff" : "#f0fdf4",
                    border: `1px solid ${n.isRead ? "#e2e8f0" : "#bbf7d0"}`,
                    borderLeft: `4px solid ${n.type === "dispute_event" ? "#ef4444" : n.type === "system_event" ? "#3b82f6" : "#10b981"}`,
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#0f172a", fontWeight: n.isRead ? 600 : 700 }}>
                      <T>{n.title}</T>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleDelete(n._id)}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.4 }}><T>{n.message}</T></p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {new Date(n.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n._id)}
                        style={{ background: "none", border: "none", color: "#059669", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <T>Mark read</T>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
