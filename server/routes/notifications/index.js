import express from "express";
import Notification from "../../models/Notification.js";
import { verifyToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

const router = express.Router();

// Get user's notifications
router.get("/", verifyToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const filter = { userId: req.userId };
  if (unreadOnly === "true") filter.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.userId, isRead: false })
  ]);

  res.json({
    notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Mark notification as read
router.patch("/:id/read", verifyToken, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  notification.isRead = true;
  await notification.save();

  res.json(notification);
}));

// Mark all notifications as read
router.patch("/read-all", verifyToken, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.userId, isRead: false },
    { isRead: true }
  );

  res.json({ message: "All notifications marked as read" });
}));

// Delete notification
router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  if (notification.userId.toString() !== req.userId.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await notification.deleteOne();
  res.json({ message: "Notification deleted successfully" });
}));

// Delete all read notifications
router.delete("/", verifyToken, asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.userId, isRead: true });
  res.json({ message: "All read notifications deleted successfully" });
}));

export default router;
