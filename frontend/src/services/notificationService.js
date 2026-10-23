import api from "./api";

// GET /api/notifications
export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

// GET /api/notifications/unread
export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread");
  return data.count;
};

// PUT /api/notifications/:id/read
export const markAsRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data.notification;
};

// PUT /api/notifications/read-all
export const markAllAsRead = async () => {
  const { data } = await api.put("/notifications/read-all");
  return data;
};

// DELETE /api/notifications/:id
export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};
