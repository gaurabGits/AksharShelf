const mongoose = require("mongoose");
const Review = require("../models/review");
const Book = require("../models/book");

const recalcBookStats = async (bookId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        book: new mongoose.Types.ObjectId(bookId),
        rating: { $gte: 1 },
      },
    },
    {
      $group: {
        _id: "$book",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating ?? 0;
  const totalRatings = stats[0]?.totalRatings ?? 0;

  await Book.findByIdAndUpdate(bookId, { averageRating, totalRatings });

  return { averageRating, totalRatings };
};

const getReviewsForBook = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id." });
    }

    const book = await Book.findById(id).select("_id averageRating totalRatings");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const reviews = await Review.find({ book: id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate("user", "name");

    return res.json({
      reviews,
      averageRating: book.averageRating ?? 0,
      totalRatings: book.totalRatings ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const upsertReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id." });
    }

    const book = await Book.findById(id).select("_id");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!comment) {
      return res.status(400).json({ message: "Comment is required." });
    }

    let rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating <= 0) {
      rating = undefined;
    }
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const setFields = { comment };
    const unsetFields = {};

    if (rating !== undefined) {
      setFields.rating = rating;
    } else {
      unsetFields.rating = 1;
    }

    const update = {
      $set: setFields,
      $setOnInsert: {
        book: id,
        user: req.user.id,
      },
    };

    if (Object.keys(unsetFields).length > 0) {
      update.$unset = unsetFields;
    }

    const review = await Review.findOneAndUpdate(
      { book: id, user: req.user.id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", "name");

    const stats = await recalcBookStats(id);

    const io = req.app.get("io");
    if (io) {
      io.to(`book:${id}`).emit("review:upserted", { review, stats });
    }

    return res.status(200).json({ review, stats });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id." });
    }

    const book = await Book.findById(id).select("_id");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = await Review.findOneAndDelete({ book: id, user: req.user.id });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const stats = await recalcBookStats(id);

    const io = req.app.get("io");
    if (io) {
      io.to(`book:${id}`).emit("review:deleted", { reviewId: review._id, stats });
    }

    return res.status(200).json({ message: "Review deleted", stats });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getReviewsForBook,
  upsertReview,
  deleteReview,
};
