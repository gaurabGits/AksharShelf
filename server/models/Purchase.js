const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional access expiry (subscription-like). Null => never expires.
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    // Metadata for admin-granted access / manual adjustments.
    grantSource: {
      type: String,
      enum: ["payment", "admin"],
      default: "payment",
      required: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
