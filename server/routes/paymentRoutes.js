const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createBookCheckout,
  confirmDummyOrderPayment,
  getOrder,
  listMyOrders,
  listMyPurchases,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/books/:bookId/checkout", protect, createBookCheckout);
router.post("/orders/:orderId/confirm", protect, confirmDummyOrderPayment);
router.get("/orders/:orderId", protect, getOrder);
router.get("/me/orders", protect, listMyOrders);
router.get("/me/purchases", protect, listMyPurchases);

module.exports = router;
