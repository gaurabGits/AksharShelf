const express = require("express");
const {
  getShelf,
  upsertShelf,
  removeFromShelf,
} = require("../controllers/bookshelfController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getShelf);
router.post("/", protect, upsertShelf);
router.delete("/:id", protect, removeFromShelf);

module.exports = router;
