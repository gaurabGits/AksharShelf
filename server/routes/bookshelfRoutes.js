const express = require("express");
const {
  getShelf,
  upsertShelf,
  updateReadingProgress,
  removeFromShelf,
} = require("../controllers/bookshelfController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getShelf);
router.post("/progress", protect, updateReadingProgress);
router.post("/", protect, upsertShelf);
router.delete("/:id", protect, removeFromShelf);

module.exports = router;
