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
  },
  { timestamps: true }
);

bookshelfSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Bookshelf", bookshelfSchema);
