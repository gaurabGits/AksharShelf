const express = require('express');
const {
  registerUser,
  signupUser,
  loginUser,
  totalCount,
  getLastUsers,
  getProfile,
  getProfileActivity,
  updateProfile,
  updatePassword,
} = require('../controllers/authControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router(); //  mini version of the Express app, used to group related routes together.

router.post("/register", registerUser);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/total-users", totalCount);
router.get("/last-users", getLastUsers);

router.get("/profile", protect, getProfile);
router.get("/profile/activity", protect, getProfileActivity);
router.put("/profile", protect, updateProfile);
router.put("/profile/password", protect, updatePassword);

module.exports = router;
