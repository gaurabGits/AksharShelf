const express = require('express');
const {registerUser, loginUser} = require('../controllers/authControllers');
const {protect} = require('../middleware/authMiddleware');
const User = require("../models/user");

const router = express.Router(); //  mini version of the Express app, used to group related routes together.

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Access granted",
      user: {
        id: req.user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
