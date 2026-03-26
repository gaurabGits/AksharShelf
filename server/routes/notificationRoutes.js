const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} = require("../controllers/notificationControllers");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getMyUnreadCount);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markNotificationRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;

