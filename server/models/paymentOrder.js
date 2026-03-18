const mongoose = require("mongoose");

const paymentOrderSchema = new mongoose.Schema(
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
    provider: {
      type: String,
      enum: ["dummy"],
      default: "dummy",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: "NPR",
      required: true,
    },
    amountMinor: {
      // Minor units (e.g., paisa). Avoids floating point issues.
      type: Number,
      required: true,
      min: 0,
    },
    idempotencyKey: {
      type: String,
      required: true,
      maxlength: 128,
    },
    clientSecret: {
      type: String,
      required: true,
      minlength: 16,
      maxlength: 128,
      select: false,
    },
    paymentReference: {
      type: String,
      default: null,
      maxlength: 64,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

paymentOrderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);

