const Notification = require("../models/Notification");

// Helper function to create notifications internally from backend triggers
const createNotification = async (userId, title, message, type = "contract_event", contractId = null, disputeId = null) => {
  try {
    if (!userId || !title || !message) return null;
    const notification = await Notification.create({
      user: userId,
      title: title.trim(),
      message: message.trim(),
      type,
      relatedContract: contractId,
      relatedDispute: disputeId,
      isRead: false,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification trigger:", error.message);
    return null;
  }
};

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private (strictly filtered by req.user._id)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("relatedContract", "cropName status")
      .populate("relatedDispute", "title status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: notifications.length, notifications });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching notifications", error: error.message });
  }
};

// @desc    Get logged-in user's unread notification count & list
// @route   GET /api/notifications/unread
// @access  Private (strictly filtered by req.user._id)
const getUnreadCount = async (req, res) => {
  try {
    const unreadNotifications = await Notification.find({ user: req.user._id, isRead: false })
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: unreadNotifications.length, unreadNotifications });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching unread count", error: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (verifies user ownership)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to modify this notification" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating notification", error: error.message });
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating notifications", error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (verifies user ownership)
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this notification" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting notification", error: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
