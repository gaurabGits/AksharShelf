const Admin = require("../models/admin");
const mongoose = require("mongoose");
const User = require("../models/user");
const Book = require("../models/book");
const Review = require("../models/review");
const Purchase = require("../models/Purchase");
const PaymentOrder = require("../models/paymentOrder");
const jwt = require("jsonwebtoken");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const minorToMajor = (amountMinor) => {
  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n) / 100;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseExpiryInput = ({ expiresAt, durationDays, neverExpire }) => {
  if (neverExpire === true) return { expiresAt: null };

  const days = Number(durationDays);
  if (Number.isFinite(days) && days > 0) {
    return { expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000) };
  }

  if (expiresAt === null) return { expiresAt: null };
  if (typeof expiresAt === "string" && expiresAt.trim() === "") return { expiresAt: null };
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return { error: "Invalid expiresAt date." };
    return { expiresAt: d };
  }

  return { error: "Provide expiresAt, durationDays, or neverExpire." };
};

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
    const payload = { ...(req.body ?? {}) };
    const isPaid = payload.isPaid === true || payload.isPaid === "true";
    const parsedPrice = Number(payload.price);

    payload.isPaid = isPaid;
    if (isPaid) {
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: "Paid books must have a price greater than 0." });
      }
      payload.price = parsedPrice;
    } else {
      payload.price = 0;
    }

    const book = new Book(payload);
    const savedBook = await book.save();
    return res.status(201).json(savedBook);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const editBook = async (req, res) => {
  try {
    const existing = await Book.findById(req.params.id).select("isPaid price");
    if (!existing) return res.status(404).json({ message: "Book not found" });

    const updates = { ...(req.body ?? {}) };

    let isPaid = existing.isPaid;
    if (typeof updates.isPaid !== "undefined") {
      isPaid = updates.isPaid === true || updates.isPaid === "true";
    }
    updates.isPaid = isPaid;

    let price = existing.price;
    if (typeof updates.price !== "undefined") {
      price = Number(updates.price);
    }

    if (isPaid) {
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ message: "Paid books must have a price greater than 0." });
      }
      updates.price = price;
    } else {
      updates.price = 0;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
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

const getPaymentOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const status = String(req.query.status || "").trim().toLowerCase();
    const bookId = String(req.query.bookId || "").trim();
    const userId = String(req.query.userId || "").trim();

    const filter = {};
    if (status) filter.status = status;
    if (bookId) filter.book = bookId;
    if (userId) filter.user = userId;

    const statsAgg = await PaymentOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          paidOrders: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          failedOrders: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          expiredOrders: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
          paidAmountMinor: {
            $sum: {
              $cond: [
                { $eq: ["$status", "paid"] },
                { $ifNull: ["$amountMinor", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsRow = statsAgg?.[0] ?? {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      failedOrders: 0,
      expiredOrders: 0,
      paidAmountMinor: 0,
    };

    const [total, orders] = await Promise.all([
      PaymentOrder.countDocuments(filter),
      PaymentOrder.find(filter)
        .populate("user", "name email")
        .populate("book", "title isPaid price")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const normalizedOrders = (orders || []).map((o) => ({
      ...o,
      amount: minorToMajor(o?.amountMinor),
    }));

    return res.json({
      total,
      page,
      limit,
      stats: {
        ...statsRow,
        paidAmount: minorToMajor(statsRow.paidAmountMinor),
      },
      orders: normalizedOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPurchases = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const bookId = String(req.query.bookId || "").trim();
    const userId = String(req.query.userId || "").trim();

    const filter = {};
    if (bookId) filter.book = bookId;
    if (userId) filter.user = userId;

    const [total, purchases] = await Promise.all([
      Purchase.countDocuments(filter),
      Purchase.find(filter)
        .populate("user", "name email")
        .populate("book", "title isPaid price")
        .populate("grantedBy", "username")
        .sort({ purchasedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const now = Date.now();
    const normalized = (purchases || []).map((p) => ({
      ...p,
      isExpired: Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= now),
    }));

    return res.json({ total, page, limit, purchases: normalized });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/admin/payments/purchases/grant
const grantPurchaseAccess = async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    const bookId = String(req.body?.bookId || "").trim();
    const adminNote = String(req.body?.adminNote || "").trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId." });
    }
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid bookId." });
    }

    const [user, book] = await Promise.all([
      User.findById(userId).select("_id").lean(),
      Book.findById(bookId).select("_id title isPaid price").lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!book) return res.status(404).json({ message: "Book not found." });

    const parsed = parseExpiryInput({
      expiresAt: req.body?.expiresAt,
      durationDays: req.body?.durationDays,
      neverExpire: req.body?.neverExpire,
    });
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const purchase = await Purchase.findOneAndUpdate(
      { user: userId, book: bookId },
      {
        $set: {
          purchasedAt: new Date(),
          expiresAt: parsed.expiresAt,
          grantSource: "admin",
          grantedBy: req.admin?._id ?? null,
          adminNote: adminNote || null,
        },
        $setOnInsert: { user: userId, book: bookId },
      },
      { new: true, upsert: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("book", "title isPaid price")
      .populate("grantedBy", "username");

    return res.json({ message: "Access granted.", purchase });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/admin/payments/purchases/:id
const updatePurchaseAccess = async (req, res) => {
  try {
    const purchaseId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return res.status(400).json({ message: "Invalid purchase id." });
    }

    const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote.trim() : undefined;
    const revoke = Boolean(req.body?.revoke);

    let expiresAt;
    if (revoke) {
      expiresAt = new Date();
    } else {
      const parsed = parseExpiryInput({
        expiresAt: req.body?.expiresAt,
        durationDays: req.body?.durationDays,
        neverExpire: req.body?.neverExpire,
      });
      if (parsed.error && adminNote === undefined) {
        return res.status(400).json({ message: parsed.error });
      }
      expiresAt = parsed.expiresAt;
    }

    const set = {
      grantSource: "admin",
      grantedBy: req.admin?._id ?? null,
    };
    if (adminNote !== undefined) set.adminNote = adminNote || null;
    if (revoke || expiresAt !== undefined) set.expiresAt = expiresAt;

    const updated = await Purchase.findByIdAndUpdate(
      purchaseId,
      { $set: set },
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .populate("book", "title isPaid price")
      .populate("grantedBy", "username");

    if (!updated) return res.status(404).json({ message: "Purchase not found." });

    return res.json({ message: "Access updated.", purchase: updated });
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
  getPaymentOrders,
  getPurchases,
  grantPurchaseAccess,
  updatePurchaseAccess,
};
