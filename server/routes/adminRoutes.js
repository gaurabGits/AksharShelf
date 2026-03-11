const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminMiddleware");
const {
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
} = require("../controllers/adminControllers");

router.post("/login", loginAdmin);
router.get("/dashboard", adminAuth, getDashboardStats);

// User management
router.get("/users", adminAuth, getAllUsers);
router.delete("/users/:id", adminAuth, deleteUser);
router.put("/users/:id/block", adminAuth, toggleBlockUser);

// Book management
router.get("/books", adminAuth, getAllBooks);
router.post("/books", adminAuth, addBook);
router.put("/books/:id", adminAuth, editBook);
router.delete("/books/:id", adminAuth, deleteBook);

// Review management
router.get("/reviews", adminAuth, getAllReviews);
router.delete("/reviews/:id", adminAuth, deleteReview);

module.exports = router;

