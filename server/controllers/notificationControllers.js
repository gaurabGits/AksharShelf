const mongoose = require("mongoose");
const Notification = require("../models/notification");
const User = require("../models/user");

const parseLimit = (value, fallback = 20) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 1), 50);
};

// User: list notifications
const getMyNotifications = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 20);
    const unreadOnly = String(req.query.unread || "").trim() === "1";

    const match = { recipient: req.user.id };
    if (unreadOnly) match.readAt = null;

    const [items, unreadCount] = await Promise.all([
      Notification.find(match)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id, readAt: null }),
    ]);

    return res.json({
      notifications: items.map((n) => ({
        id: String(n._id),
        source: n.source,
        category: n.category,
        event: n.event,
        level: n.level,
        title: n.title,
        message: n.message,
        link: n.link,
        batchId: n.batchId,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      readAt: null,
    });
    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Notification not found." });

    return res.json({
      message: "Marked as read.",
      notification: {
        id: String(updated._id),
        readAt: updated.readAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { recipient: req.user.id, readAt: null },
      { $set: { readAt: now } }
    );

    return res.json({
      message: "All notifications marked as read.",
      updated: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id,
    }).lean();

    if (!deleted) return res.status(404).json({ message: "Notification not found." });

    return res.json({ message: "Notification deleted." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: create notification(s)
const createAdminNotification = async (req, res) => {
  try {
    const audience = String(req.body?.audience || "all").trim().toLowerCase();
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const level = String(req.body?.level || "info").trim().toLowerCase();
    const link = String(req.body?.link || "").trim();
    const category = String(req.body?.category || "notice").trim().toLowerCase();

    if (!title) return res.status(400).json({ message: "Title is required." });
    if (!["info", "warning", "critical"].includes(level)) {
      return res.status(400).json({ message: "Invalid level. Use info, warning, or critical." });
    }
    if (!["security", "notice", "system"].includes(category)) {
      return res.status(400).json({ message: "Invalid category." });
    }

    const batchId = String(new mongoose.Types.ObjectId());

    let userIds = [];
    if (audience === "all") {
      const users = await User.find().select("_id").lean();
      userIds = users.map((u) => String(u._id));
    } else if (audience === "users") {
      const raw = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
      userIds = raw.map((v) => String(v)).filter((v) => mongoose.isValidObjectId(v));
      if (userIds.length === 0) {
        return res.status(400).json({ message: "Provide at least one valid user id." });
      }
    } else {
      return res.status(400).json({ message: "Invalid audience. Use all or users." });
    }

    const docs = userIds.map((uid) => ({
      recipient: uid,
      source: "admin",
      createdByAdmin: req.admin._id,
      category,
      event: "admin_notice",
      level,
      title,
      message,
      link,
      batchId,
      readAt: null,
    }));

    if (docs.length === 0) {
      return res.status(400).json({ message: "No recipients found." });
    }

    await Notification.insertMany(docs, { ordered: false });

    return res.status(201).json({
      message: "Notification sent.",
      batchId,
      recipients: docs.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdminSentNotifications = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 20);

    const rows = await Notification.aggregate([
      { $match: { createdByAdmin: req.admin._id, source: "admin", batchId: { $ne: "" } } },
      {
        $group: {
          _id: "$batchId",
          title: { $first: "$title" },
          message: { $first: "$message" },
          link: { $first: "$link" },
          level: { $first: "$level" },
          category: { $first: "$category" },
          createdAt: { $max: "$createdAt" },
          recipients: { $sum: 1 },
          readCount: {
            $sum: {
              $cond: [{ $ne: ["$readAt", null] }, 1, 0],
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);

    return res.json({
      sent: rows.map((r) => ({
        batchId: r._id,
        title: r.title,
        message: r.message,
        link: r.link,
        level: r.level,
        category: r.category,
        createdAt: r.createdAt,
        recipients: r.recipients,
        readCount: r.readCount,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  createAdminNotification,
  getAdminSentNotifications,
};
