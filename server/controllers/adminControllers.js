const Admin = require("../models/admin");
const User = require("../models/user");
const Book = require("../models/book");
const Review = require("../models/review");
const jwt = require("jsonwebtoken");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const loginAdmin = async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const defaultUsername = String(process.env.ADMIN_USERNAME || "admin").trim();
    const defaultPassword = String(process.env.ADMIN_PASSWORD || "admin");

    let admin = await Admin.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, "i") },
    });

    // If admin row does not exist yet, create it from .env defaults.
    if (!admin) {
      if (username.toLowerCase() === defaultUsername.toLowerCase() && password === defaultPassword) {
        admin = await Admin.create({
          username: defaultUsername,
          password: defaultPassword,
        });
      } else {
        return res.status(401).json({ message: "Invalid username or password" });
      }
    }

    // Recover legacy plain-text admin password and re-hash it once.
    let isMatch = false;
    try {
      isMatch = await admin.matchPassword(password);
    } catch (_error) {
      if (typeof admin.password === "string" && admin.password === password) {
        admin.password = password;
        await admin.save();
        isMatch = true;
      }
    }

    if (!isMatch && username.toLowerCase() === defaultUsername.toLowerCase() && password === defaultPassword) {
      admin.password = defaultPassword;
      await admin.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    return res.json({
      _id: admin._id,
      username: admin.username,
      lastLoginAt: admin.lastLoginAt,
      token: generateToken(admin._id),
      message: "Login successful",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardStats = async (_req, res) => {
  try {
    const [totalUsers, totalBooks, blockedUsers, totalReviews, avgAgg] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Review.countDocuments(),
      Review.aggregate([
        { $match: { rating: { $gte: 1, $lte: 5 } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);

    const avgRating = Number(avgAgg?.[0]?.avgRating) || 0;

    return res.json({
      totalUsers,
      totalBooks,
      blockedUsers,
      totalReviews,
      avgRating,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.json({
      message: user.isBlocked ? "User blocked" : "User unblocked",
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllBooks = async (_req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    return res.json(books);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addBook = async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    return res.status(201).json(savedBook);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const editBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.json(book);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.json({ message: "Book deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllReviews = async (_req, res) => {
  try {
    const reviews = await Review.find()
      .populate("book", "title author coverImage")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    await review.deleteOne();
    return res.json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  loginAdmin,
  getDashboardStats,
  getAllUsers,
  deleteUser,
  toggleBlockUser,
  getAllBooks,
  addBook,
  editBook,
  deleteBook,
  getAllReviews,
  deleteReview,
};

