const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
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
      maxlength: 160,
    },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

adminActivitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AdminActivity", adminActivitySchema);
