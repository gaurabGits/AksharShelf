const express = require('express');
const { addBook, getBookById, readBook, getAllBooks } = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
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

router.get("/:id", getBookById);
router.get("/", getAllBooks);
router.get("/:id/read", protect, readBook)

module.exports = router;