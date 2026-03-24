const path = require("path");
const jwt = require("jsonwebtoken");

const Book = require("../models/book");
const Purchase = require("../models/Purchase");
const User = require("../models/user");

const getBearerToken = (req) => {
  const header = req.headers?.authorization;
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  return token ? String(token).trim() : null;
};

// Protect direct access to uploaded PDFs.
// Images can remain public, but PDFs for paid books must require purchase.
const uploadsGuard = async (req, res, next) => {
  try {
    const fileName = String(req.path || "").replace(/^\/+/, "");
    const ext = path.extname(fileName).toLowerCase();
    if (ext !== ".pdf") return next();

    const pdfUrl = `/uploads/${fileName}`;
    const book = await Book.findOne({ pdfUrl }).select("_id isPaid").lean();
    if (!book) {
      return res.status(404).json({ message: "File not found." });
    }

    if (!book.isPaid) return next();

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }

    const userId = decoded?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }

    const user = await User.findById(userId).select("role isBlocked").lean();
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    const role = String(user?.role || "").toLowerCase();
    if (role === "admin") return next();

    const now = new Date();
    const purchase = await Purchase.findOne({
      user: user._id,
      book: book._id,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select("_id expiresAt")
      .lean();
    if (!purchase) {
      return res.status(403).json({ message: "This is a paid book. Purchase required." });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = uploadsGuard;
