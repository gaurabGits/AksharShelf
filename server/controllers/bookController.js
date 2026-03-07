const Book = require("../models/book");
const Purchase = require("../models/Purchase");
const path = require("path");
const fs = require("fs");

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

    // Define filePath properly
    const filePath = path.join(__dirname, "..", book.pdfUrl.replace(/^\//, ""));

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

    const access = { canRead };
    res.json({ book, access });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all books
const getAllBooks = async (req, res) => {
  try {
      const { search, category, type, page = 1, limit = 10 } = req.query;

      let query = {};

      // Search by title
      if (search) {
        query.title = { $regex: search, $options: "i" };
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Filter free / paid
      if (type === "free") {
        query.price = 0;
      }
      if (type === "paid") {
        query.price = { $gt: 0 };
      }

      const books = await Book.find(query)
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await Book.countDocuments(query);
      
      if (books.length === 0) {
          return res.status(404).json({
            message: "No books found."
          });
      }

      res.json({
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        books,
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};



module.exports = { addBook, getBookById, readBook, getAllBooks };
