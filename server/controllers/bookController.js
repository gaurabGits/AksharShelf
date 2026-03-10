const Book = require("../models/book");
const Bookmark = require("../models/bookmark");
const Bookshelf = require("../models/bookshelf");
const Purchase = require("../models/Purchase");
const path = require("path");
const fs = require("fs");

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
    const price = isPaid ? (Number.isFinite(parsedPrice) ? parsedPrice : 0) : 0;

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
    if (book.isPaid && req.user.role.toLowerCase() !== "admin") {
      const purchase = await Purchase.findOne({
        user: req.user.id,
        book: book._id,
      });

      if (!purchase) {
        return res.status(403).json({ message: "This is a paid book. Purchase required." });
      }
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
        const purchase = await Purchase.findOne({
          user: req.user.id,
          book: book._id,
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
    const normalizedBook = {
      ...book.toObject(),
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
      query.price = 0;
    }
    if (type === "paid") {
      query.price = { $gt: 0 };
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

module.exports = {
  addBook,
  getBookById,
  readBook,
  getAllBooks,
  getBookmarkedBooks,
  addBookmark,
};
