const mongoose = require("mongoose");

const bookshelfSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["reading", "completed", "planned"],
      required: true,
      default: "reading",
    },
    totalReadSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReadPage: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bookshelfSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Bookshelf", bookshelfSchema);
