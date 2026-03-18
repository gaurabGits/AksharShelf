const jwt = require('jsonwebtoken');
const User = require("../models/user");

const protect = async (req, res, next) => {
    const header = req.headers?.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = String(header.split(" ")[1] ?? "").trim();
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_error) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }

    const userId = decoded?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }

    try {
        const user = await User.findById(userId).select("role isBlocked").lean();
        if (!user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }
        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account is blocked. Contact support." });
        }

        req.user = {
            id: String(user._id),
            role: user.role,
        };

        return next();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const optionalProtect = async (req, _res, next) => {
    const header = req.headers?.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return next();
    }

    const token = String(header.split(" ")[1] ?? "").trim();
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded?.userId;
        if (!userId) {
            return next();
        }

        const user = await User.findById(userId).select("role isBlocked").lean();
        if (!user || user.isBlocked) {
            return next();
        }

        req.user = {
            id: String(user._id),
            role: user.role,
        };
    } catch (_error) {
        // Ignore invalid token on optional auth routes.
    }

    return next();
};


module.exports = { protect, optionalProtect };
