const express = require('express');
const {
  addBook,
  getBookById,
  readBook,
  getAllBooks,
  getPopularBooks,
  getBookmarkedBooks,
  addBookmark,
} = require('../controllers/bookController');
const {
  getReviewsForBook,
  upsertReview,
  deleteReview
} = require("../controllers/reviewController");
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const upload = require("../middleware/uploadMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");


const router = express.Router();

// router.post("/", protect, addBook);
// router.post("/", protect, getAllBooks);

// Only admins can add a book
router.post("/", protect, adminOnly, 
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]), 
    addBook
);

router.get("/popular", optionalProtect, getPopularBooks);
router.get("/bookmarks", protect, getBookmarkedBooks);
router.post("/:id/bookmark", protect, addBookmark);
router.get("/:id/reviews", optionalProtect, getReviewsForBook);
router.post("/:id/reviews", protect, upsertReview);
router.delete("/:id/reviews", protect, deleteReview);


router.get("/", optionalProtect, getAllBooks);
router.get("/:id/read", protect, readBook)
router.get("/:id", optionalProtect, getBookById);


module.exports = router;
