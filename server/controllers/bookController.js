const Book = require("../models/book");
const Bookmark = require("../models/bookmark");
const Bookshelf = require("../models/bookshelf");
const BookActivity = require("../models/bookActivity");
const Purchase = require("../models/Purchase");
const path = require("path");
const fs = require("fs");
const { computeContentBasedSimilarity } = require("../utils/recommendations/contentBased");
const { getCollaborativeScores } = require("../utils/recommendations/collaborativeFiltering");

const markActivityOnce = async ({ userId, bookId, field }) => {
  if (!userId) return false;
  const now = new Date();

  try {
    const res = await BookActivity.updateOne(
      { user: userId, book: bookId, [field]: null },
      { $set: { [field]: now } },
      { upsert: true }
    );

    return (res?.modifiedCount ?? 0) > 0 || (res?.upsertedCount ?? 0) > 0;
  } catch (err) {
    if (err?.code === 11000) return false;
    throw err;
  }
};

const attachBookmarkFlag = async (books, userId) => {
  const normalized = books.map((book) => (typeof book.toObject === "function" ? book.toObject() : book));

  if (!userId || normalized.length === 0) {
    return normalized.map((book) => ({ ...book, isBookmarked: false }));
  }

  const bookIds = normalized.map((book) => book._id);
  const bookmarks = await Bookmark.find({
    user: userId,
    book: { $in: bookIds },
  }).select("book");

  const bookmarkedIds = new Set(bookmarks.map((item) => String(item.book)));

  return normalized.map((book) => ({
    ...book,
    isBookmarked: bookmarkedIds.has(String(book._id)),
  }));
};

// Add a new book
const addBook = async (req, res) => {
  try {
    const { title, author, description, category } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.coverImage?.[0];

    const pdfUrl = pdfFile
      ? `/uploads/${pdfFile.filename}`
      : req.body.pdfUrl;

    if (!pdfUrl) {
      return res.status(400).json({ message: "PDF file is required." });
    }

    const coverImage = coverFile
      ? `/uploads/${coverFile.filename}`
      : req.body.coverImage || "";

    const isPaid = req.body.isPaid === true || req.body.isPaid === "true";
    const parsedPrice = Number(req.body.price);
    if (isPaid) {
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: "Paid books must have a price greater than 0." });
      }
    }
    const price = isPaid ? parsedPrice : 0;

    const book = await Book.create({
      title,
      author,
      description,
      category,
      pdfUrl,
      coverImage,
      isPaid,
      price,
    });

    res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Read book
const readBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Paid book check
    const userId = req.user?.id ?? null;
    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    if (book.isPaid && !isAdmin) {
      if (!userId) {
        return res.status(401).json({ message: "Login required to read this paid book." });
      }

      const now = new Date();
      const purchase = await Purchase.findOne({
        user: userId,
        book: book._id,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      });

      if (!purchase) {
        return res.status(403).json({ message: "This is a paid book. Purchase required." });
      }
    }

    const didMarkRead = await markActivityOnce({ userId, bookId: book._id, field: "readAt" });
    if (didMarkRead) {
      await Book.updateOne({ _id: book._id }, { $inc: { reads: 1 } }, { timestamps: false });
    }

    const pdfUrl = book.pdfUrl || "";

    // Support base64 data URLs (admin uploads)
    if (pdfUrl.startsWith("data:")) {
      const match = pdfUrl.match(/^data:application\/pdf;base64,(.+)$/i);
      if (!match) {
        return res.status(400).json({ message: "Invalid PDF data." });
      }
      const buffer = Buffer.from(match[1], "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);
    }

    // If pdfUrl is a full URL, redirect
    if (/^https?:\/\//i.test(pdfUrl)) {
      return res.redirect(pdfUrl);
    }

    // Otherwise assume local uploads path
    const filePath = path.join(__dirname, "..", pdfUrl.replace(/^\//, ""));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get single book by id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    let canRead = !book.isPaid;

    if (book.isPaid && req.user) {
      const isAdmin = req.user.role?.toLowerCase() === "admin";
      if (isAdmin) {
        canRead = true;
      } else {
        const now = new Date();
        const purchase = await Purchase.findOne({
          user: req.user.id,
          book: book._id,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        });
        canRead = !!purchase;
      }
    }

    let isBookmarked = false;
    if (req.user?.id) {
      isBookmarked = !!(await Bookmark.findOne({
        user: req.user.id,
        book: book._id,
      }).select("_id"));
    }

    let shelfStatus = null;
    if (req.user?.id) {
      const shelfEntry = await Bookshelf.findOne({
        user: req.user.id,
        book: book._id,
      }).select("status");
      shelfStatus = shelfEntry?.status ?? null;
    }

    const access = { canRead };
    const bookObject = book.toObject();

    const normalizedBook = {
      ...bookObject,
      isBookmarked,
      shelfStatus,
    };

    res.json({ book: normalizedBook, access });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const { search, category, type } = req.query;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const hasPagination = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0;

    const query = {};

    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter free / paid / recent
    if (type === "free") {
      query.isPaid = false;
    }
    if (type === "paid") {
      query.isPaid = true;
    }
    if (type === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    const total = await Book.countDocuments(query);
    let booksQuery = Book.find(query).sort({ createdAt: -1 });

    if (hasPagination) {
      booksQuery = booksQuery.skip((page - 1) * limit).limit(limit);
    }

    const books = await booksQuery;
    const booksWithBookmark = await attachBookmarkFlag(books, req.user?.id);

    res.json({
      total,
      currentPage: hasPagination ? page : 1,
      totalPages: hasPagination ? Math.ceil(total / limit) : 1,
      books: booksWithBookmark,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

//get bookmarked books
const getBookmarkedBooks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("book");

    const books = bookmarks
      .filter((item) => item.book)
      .map((item) => ({
        ...item.book.toObject(),
        isBookmarked: true,
        bookmarkedAt: item.createdAt,
      }));

    return res.json({
      total: books.length,
      books,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Add bookmark
const addBookmark = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select("_id");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    await Bookmark.findOneAndUpdate(
      { user: req.user.id, book: req.params.id },
      { $setOnInsert: { user: req.user.id, book: req.params.id } },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Bookmarked successfully",
      bookmarked: true,
      bookId: req.params.id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get popular books
const getPopularBooks = async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 3;

    const books = await Book.find({})
      .sort({ reads: -1, createdAt: -1 })
      .limit(limit);

    const booksWithBookmark = await attachBookmarkFlag(books, req.user?.id);

    return res.json({
      total: booksWithBookmark.length,
      books: booksWithBookmark,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBookRecommendations = async (req, res) => {
  try {
    const bookId = req.params.id;
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 10;

    const target = await Book.findById(bookId).lean();
    if (!target) {
      return res.status(404).json({ message: "Book not found" });
    }

    const candidates = new Map();
    const pushCandidates = (items) => {
      for (const item of items) {
        if (!item?._id) continue;
        const key = String(item._id);
        if (key === String(bookId)) continue;
        if (!candidates.has(key)) candidates.set(key, item);
      }
    };

    const baseProjection = "title author description category coverImage isPaid price averageRating totalRatings reads";

    const [sameCategory, sameAuthor, popularFallback] = await Promise.all([
      Book.find({ _id: { $ne: bookId }, category: target.category }).select(baseProjection).limit(200).lean(),
      Book.find({ _id: { $ne: bookId }, author: target.author }).select(baseProjection).limit(80).lean(),
      Book.find({ _id: { $ne: bookId } })
        .select(baseProjection)
        .sort({ reads: -1, createdAt: -1 })
        .limit(120)
        .lean(),
    ]);

    pushCandidates(sameCategory);
    pushCandidates(sameAuthor);
    if (candidates.size < 80) pushCandidates(popularFallback);

    const scored = [];
    for (const candidate of candidates.values()) {
      const sim = computeContentBasedSimilarity(target, candidate);
      scored.push({
        ...candidate,
        recommendation: {
          algorithm: "content_based",
          score: sim.score,
          reasons: sim.reasons,
        },
      });
    }

    scored.sort((a, b) => {
      if (b.recommendation.score !== a.recommendation.score) return b.recommendation.score - a.recommendation.score;
      const br = Number.isFinite(b.reads) ? b.reads : 0;
      const ar = Number.isFinite(a.reads) ? a.reads : 0;
      return br - ar;
    });

    const top = scored.slice(0, limit);
    const topWithBookmarks = await attachBookmarkFlag(top, req.user?.id);

    return res.json({
      algorithm: "content_based",
      total: topWithBookmarks.length,
      books: topWithBookmarks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBookCollaborativeRecommendations = async (req, res) => {
  try {
    const bookId = req.params.id;
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 12;

    const target = await Book.findById(bookId).select("_id").lean();
    if (!target) {
      return res.status(404).json({ message: "Book not found" });
    }

    const scores = await getCollaborativeScores(BookActivity, bookId, {
      maxUsers: 400,
      maxCandidates: 500,
    });

    const baseProjection = "title author description category coverImage isPaid price averageRating totalRatings reads";

    let orderedBooks = [];
    if (scores.length > 0) {
      const top = scores.slice(0, limit * 3);
      const idOrder = top.map((x) => String(x._id));
      const scoreById = new Map(top.map((x) => [String(x._id), x]));

      const docs = await Book.find({ _id: { $in: idOrder } }).select(baseProjection).lean();
      const docById = new Map(docs.map((d) => [String(d._id), d]));
      orderedBooks = idOrder.map((id) => docById.get(id)).filter(Boolean);

      orderedBooks = orderedBooks.slice(0, limit).map((book) => {
        const stat = scoreById.get(String(book._id));
        const readers = Number.isFinite(stat?.readers) ? stat.readers : 0;
        const reasons = [];
        if (readers > 0) reasons.push("Readers also read");

        return {
          ...book,
          recommendation: {
            algorithm: "collaborative",
            score: Number.isFinite(stat?.score) ? stat.score : 0,
            reasons,
          },
        };
      });
    } else {
      const fallback = await Book.find({ _id: { $ne: bookId } })
        .select(baseProjection)
        .sort({ reads: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      orderedBooks = fallback.map((book) => ({
        ...book,
        recommendation: {
          algorithm: "collaborative",
          score: 0,
          reasons: ["Popular right now"],
        },
      }));
    }

    const booksWithBookmarks = await attachBookmarkFlag(orderedBooks, req.user?.id);

    return res.json({
      algorithm: "collaborative",
      total: booksWithBookmarks.length,
      books: booksWithBookmarks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addBook,
  getBookById,
  readBook,
  getAllBooks,
  getPopularBooks,
  getBookmarkedBooks,
  addBookmark,
  getBookRecommendations,
  getBookCollaborativeRecommendations,
};
