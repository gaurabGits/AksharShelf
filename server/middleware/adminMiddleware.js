const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const adminAuth = async (req, res, next) => {
  let token;

  // Check if Authorization header has a Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      next(); // token valid → proceed to controller
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  const role = req.user?.role;
  if (typeof role === 'string' && role.toLowerCase() === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = adminAuth;
module.exports.adminAuth = adminAuth;
module.exports.adminOnly = adminOnly;
