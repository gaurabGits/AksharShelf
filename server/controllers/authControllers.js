const User = require("../models/user");
const Review = require("../models/review");
const Bookshelf = require("../models/bookshelf");
const Notification = require("../models/notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const toUserDto = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign(
    {
      userId: user._id,
      userRole: user.role,
    },
    secret,
    { expiresIn: "1h" }
  );
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = createToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: toUserDto(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Contact support." });
    }

    let isMatch = false;
    try {
      isMatch = typeof user.matchPassword === "function"
        ? await user.matchPassword(password)
        : await bcrypt.compare(password, user.password);
    } catch (_error) {
      // Backward compatibility: handle legacy plain-text passwords by upgrading on login.
      if (typeof user.password === "string" && user.password === password) {
        user.password = password;
        await user.save();
        isMatch = true;
      }
    }

    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: toUserDto(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const totalCount = async (_req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLastUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .select('name');

    res.json({
      users: users.map((u) => ({ id: u._id, name: u.name })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user: toUserDto(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfileActivity = async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const [reviews, pins] = await Promise.all([
      Review.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('book', 'title author coverImage'),
      Bookshelf.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('book', 'title author coverImage'),
    ]);

    res.json({
      reviews: reviews
        .filter((review) => review.book)
        .map((review) => ({
          _id: review._id,
          book: review.book,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        })),
      pins: pins
        .filter((entry) => entry.book)
        .map((entry) => ({
          _id: entry._id,
          book: entry.book,
          status: entry.status,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() && !email?.trim()) {
      return res.status(400).json({ message: "Provide at least a name or email." });
    }

    const updates = {};
    if (name?.trim()) updates.name = name.trim();

    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email address." });
      }

      const taken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user.id },
      });
      if (taken) {
        return res.status(409).json({ message: "That email is already in use." });
      }

      updates.email = normalizedEmail;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: "Profile updated successfully.",
      user: toUserDto(updated),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That email is already in use." });
    }
    res.status(500).json({ message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: "User not found" });

    let isMatch = false;
    let passwordWasPlaintext = false;

    try {
      isMatch = typeof user.matchPassword === "function"
        ? await user.matchPassword(currentPassword)
        : await bcrypt.compare(currentPassword, user.password);
    } catch (_error) {
      if (typeof user.password === "string" && user.password === currentPassword) {
        isMatch = true;
        passwordWasPlaintext = true;
      }
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    let isSame = false;
    try {
      isSame = await bcrypt.compare(newPassword, user.password);
    } catch (_error) {
      isSame = passwordWasPlaintext && user.password === newPassword;
    }
    if (isSame) {
      return res.status(400).json({ message: "New password must differ from current." });
    }

    user.password = newPassword;
    await user.save();

    // Persist a security notification for the user (non-blocking).
    try {
      await Notification.create({
        recipient: user._id,
        source: "system",
        category: "security",
        event: "password_changed",
        level: "warning",
        title: "Password changed",
        message:
          "Your account password was changed. If you didn’t do this, please contact support immediately.",
      });
    } catch (notifyError) {
      // Avoid failing password change if notification storage fails.
      // eslint-disable-next-line no-console
      console.error("Failed to create password-change notification:", notifyError?.message || notifyError);
    }

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  signupUser,
  registerUser: signupUser,
  loginUser,
  totalCount,
  getLastUsers,
  getProfile,
  getProfileActivity,
  updateProfile,
  updatePassword,
};
