const Book = require("../models/book");
const Bookshelf = require("../models/bookshelf");

const VALID_STATUSES = new Set(["reading", "completed", "planned"]);

const getShelf = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };

    if (status) {
      if (!VALID_STATUSES.has(status)) {
        return res.status(400).json({ message: "Invalid shelf status." });
      }
      filter.status = status;
    }

    const entries = await Bookshelf.find(filter)
      .sort({ updatedAt: -1 })
      .populate("book");

    const books = entries
      .filter((entry) => entry.book)
      .map((entry) => ({
        ...entry.book.toObject(),
        shelfStatus: entry.status,
        shelfUpdatedAt: entry.updatedAt,
        totalReadSeconds: entry.totalReadSeconds ?? 0,
        lastReadPage: entry.lastReadPage ?? 1,
        lastReadAt: entry.lastReadAt ?? null,
      }));

    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const upsertShelf = async (req, res) => {
  try {
    const { bookId, status } = req.body;

    if (!bookId || !status) {
      return res.status(400).json({ message: "bookId and status are required." });
    }

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid shelf status." });
    }

    const book = await Book.findById(bookId).select("_id");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const entry = await Bookshelf.findOneAndUpdate(
      { user: req.user.id, book: bookId },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: "Shelf updated",
      shelf: {
        bookId: String(entry.book),
        status: entry.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateReadingProgress = async (req, res) => {
  try {
    const { bookId, secondsSpent = 0, lastReadPage = 1 } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "bookId is required." });
    }

    const safeSecondsSpent = Math.max(0, Math.floor(Number(secondsSpent) || 0));
    const safeLastReadPage = Math.max(1, Math.floor(Number(lastReadPage) || 1));

    const book = await Book.findById(bookId).select("_id");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const entry = await Bookshelf.findOneAndUpdate(
      { user: req.user.id, book: bookId },
      {
        $set: {
          status: "reading",
          lastReadPage: safeLastReadPage,
          lastReadAt: new Date(),
        },
        $inc: {
          totalReadSeconds: safeSecondsSpent,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: "Reading progress updated",
      progress: {
        bookId: String(entry.book),
        status: entry.status,
        totalReadSeconds: entry.totalReadSeconds ?? 0,
        lastReadPage: entry.lastReadPage ?? 1,
        lastReadAt: entry.lastReadAt ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeFromShelf = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await Bookshelf.findOneAndDelete({
      user: req.user.id,
      book: id,
    });

    if (!entry) {
      return res.status(404).json({ message: "Book not found in shelf." });
    }

    return res.json({ message: "Removed from shelf." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getShelf,
  upsertShelf,
  updateReadingProgress,
  removeFromShelf,
};
