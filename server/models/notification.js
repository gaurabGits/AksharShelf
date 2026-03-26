const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["system", "admin"],
      default: "system",
      index: true,
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ["security", "notice", "system"],
      default: "system",
      index: true,
    },
    event: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    level: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    link: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    batchId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

