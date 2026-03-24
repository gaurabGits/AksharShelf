const crypto = require("crypto");
const mongoose = require("mongoose");

const Book = require("../models/book");
const Purchase = require("../models/Purchase");
const PaymentOrder = require("../models/paymentOrder");

const ORDER_TTL_MS = 15 * 60 * 1000;

const activePurchaseClause = (now) => ({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });

const toAmountMinor = (price) => {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 0) return null;
  return Math.round(numeric * 100);
};

const minorToMajor = (amountMinor) => {
  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n) / 100;
};

const digitsOnly = (value) => String(value ?? "").replace(/[^\d]/g, "");

const luhnValid = (raw) => {
  const digits = digitsOnly(raw);
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let doubleIt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (doubleIt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleIt = !doubleIt;
  }
  return sum % 10 === 0;
};

const buildClientSecret = () => crypto.randomBytes(24).toString("hex");
const buildPaymentReference = () => `DUMMY_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

const serializeBookRef = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    const id = value?._id ? String(value._id) : null;
    return {
      id,
      title: value?.title ?? "",
      coverImage: value?.coverImage ?? "",
      isPaid: Boolean(value?.isPaid),
      price: Number.isFinite(Number(value?.price)) ? Number(value.price) : 0,
    };
  }
  return { id: String(value) };
};

const serializeOrder = (orderDoc, { includeClientSecret = false } = {}) => {
  if (!orderDoc) return null;
  const obj = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;

  const base = {
    id: String(obj._id),
    book: serializeBookRef(obj.book),
    status: obj.status,
    provider: obj.provider,
    currency: obj.currency,
    amountMinor: obj.amountMinor,
    amount: minorToMajor(obj.amountMinor),
    expiresAt: obj.expiresAt,
    paidAt: obj.paidAt ?? null,
    paymentReference: obj.paymentReference ?? null,
    failureReason: obj.failureReason ?? null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };

  if (includeClientSecret) {
    base.clientSecret = obj.clientSecret;
  }

  return base;
};

// POST /api/payments/books/:bookId/checkout
const createBookCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book id." });
    }

    const book = await Book.findById(bookId).select("_id title isPaid price").lean();
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (!book.isPaid) {
      return res.status(400).json({ message: "This book is free (no payment required)." });
    }

    const amountMinor = toAmountMinor(book.price);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return res.status(400).json({ message: "This book has an invalid price." });
    }

    const now = new Date();
    const existingPurchase = await Purchase.findOne({
      user: userId,
      book: book._id,
      ...activePurchaseClause(now),
    })
      .select("_id expiresAt")
      .lean();
    if (existingPurchase) {
      return res.json({
        message: "Already purchased.",
        access: { canRead: true },
        book: { id: String(book._id), title: book.title },
        order: null,
      });
    }

    const rawKey = (req.get("Idempotency-Key") ?? "").trim();
    const idempotencyKey = rawKey.length > 0 ? rawKey.slice(0, 128) : crypto.randomUUID();

    const expiresAt = new Date(now.getTime() + ORDER_TTL_MS);

    const existingOrder = await PaymentOrder.findOne({ user: userId, idempotencyKey }).select("+clientSecret");
    if (existingOrder) {
      const isExpired = existingOrder.expiresAt && existingOrder.expiresAt.getTime() <= now.getTime();
      if (existingOrder.status === "pending" && isExpired) {
        await PaymentOrder.updateOne(
          { _id: existingOrder._id, status: "pending" },
          { $set: { status: "expired", failureReason: "Checkout expired." } }
        );
        existingOrder.status = "expired";
        existingOrder.failureReason = "Checkout expired.";
      }

      return res.json({
        book: { id: String(book._id), title: book.title },
        order: serializeOrder(existingOrder, { includeClientSecret: true }),
        idempotencyKey,
      });
    }

    let orderDoc;
    try {
      orderDoc = await PaymentOrder.create({
        user: userId,
        book: book._id,
        provider: "dummy",
        status: "pending",
        currency: "NPR",
        amountMinor,
        idempotencyKey,
        clientSecret: buildClientSecret(),
        expiresAt,
      });
    } catch (err) {
      // Idempotency race: return the already-created order.
      if (err?.code === 11000) {
        const raced = await PaymentOrder.findOne({ user: userId, idempotencyKey }).select("+clientSecret");
        if (raced) {
          return res.json({
            book: { id: String(book._id), title: book.title },
            order: serializeOrder(raced, { includeClientSecret: true }),
            idempotencyKey,
          });
        }
      }
      throw err;
    }

    return res.status(201).json({
      book: { id: String(book._id), title: book.title },
      order: serializeOrder(orderDoc, { includeClientSecret: true }),
      idempotencyKey,
      dummyPayment: {
        note: "Dummy payment only. Use any Luhn-valid card number to simulate success.",
        testCards: [
          { cardNumber: "4242424242424242", outcome: "success" },
          { cardNumber: "4000000000000002", outcome: "decline" },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/orders/:orderId/confirm
const confirmDummyOrderPayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const { clientSecret, paymentMethod } = req.body ?? {};
    const secret = String(clientSecret ?? "").trim();
    if (secret.length < 16 || secret.length > 128) {
      return res.status(400).json({ message: "Missing/invalid clientSecret." });
    }

    const cardNumber = digitsOnly(paymentMethod?.cardNumber);
    const expMonth = Number(paymentMethod?.expMonth);
    const expYear = Number(paymentMethod?.expYear);
    const cvc = digitsOnly(paymentMethod?.cvc);

    if (!luhnValid(cardNumber)) {
      return res.status(402).json({ message: "Card number is invalid." });
    }
    if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
      return res.status(400).json({ message: "Invalid expMonth." });
    }
    if (!Number.isInteger(expYear) || expYear < 2000 || expYear > 2100) {
      return res.status(400).json({ message: "Invalid expYear." });
    }
    if (cvc.length < 3 || cvc.length > 4) {
      return res.status(400).json({ message: "Invalid CVC." });
    }

    const now = new Date();
    const expEnd = new Date(expYear, expMonth, 1); // first day of next month
    if (expEnd.getTime() <= now.getTime()) {
      return res.status(402).json({ message: "Card is expired." });
    }

    const order = await PaymentOrder.findOne({ _id: orderId, user: userId }).select("+clientSecret");
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "paid") {
      return res.json({ order: serializeOrder(order), access: { canRead: true } });
    }
    if (order.status !== "pending") {
      return res.status(409).json({
        message: `Order is ${order.status}. Start a new checkout.`,
        order: serializeOrder(order),
        access: { canRead: false },
      });
    }

    if (order.expiresAt && order.expiresAt.getTime() <= now.getTime()) {
      if (order.status === "pending") {
        await PaymentOrder.updateOne(
          { _id: order._id, status: "pending" },
          { $set: { status: "expired", failureReason: "Checkout expired." } }
        );
      }
      return res.status(410).json({ message: "Checkout expired.", order: serializeOrder({ ...order.toObject(), status: "expired" }) });
    }

    if (order.clientSecret !== secret) {
      return res.status(403).json({ message: "Invalid clientSecret." });
    }

    // Dummy declines for predictable testing.
    let declineReason = null;
    if (cardNumber === "4000000000000002" || cardNumber.endsWith("0002")) {
      declineReason = "Card was declined.";
    }

    if (declineReason) {
      const failed = await PaymentOrder.findOneAndUpdate(
        { _id: order._id, user: userId, status: "pending" },
        { $set: { status: "failed", failureReason: declineReason } },
        { new: true }
      );
      return res.status(402).json({ message: declineReason, order: serializeOrder(failed ?? order) });
    }

    const paidAt = new Date();
    const paymentReference = buildPaymentReference();

    const paid = await PaymentOrder.findOneAndUpdate(
      { _id: order._id, user: userId, status: "pending" },
      { $set: { status: "paid", paidAt, paymentReference, failureReason: null } },
      { new: true }
    );

    if (!paid) {
      const latest = await PaymentOrder.findOne({ _id: order._id, user: userId });
      return res.json({ order: serializeOrder(latest), access: { canRead: latest?.status === "paid" } });
    }

    // Unlock access for the user.
    await Purchase.updateOne(
      { user: userId, book: paid.book },
      {
        $set: {
          purchasedAt: new Date(),
          expiresAt: null,
          grantSource: "payment",
          grantedBy: null,
          adminNote: null,
        },
        $setOnInsert: { user: userId, book: paid.book },
      },
      { upsert: true }
    );

    return res.json({ order: serializeOrder(paid), access: { canRead: true } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/orders/:orderId
const getOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await PaymentOrder.findOne({ _id: orderId, user: userId })
      .populate("book", "title coverImage isPaid price")
      .lean();
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json({ order: serializeOrder(order) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/me/orders
const listMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const status = String(req.query.status || "").trim().toLowerCase();

    const filter = { user: userId };
    if (status) filter.status = status;

    const [total, orders] = await Promise.all([
      PaymentOrder.countDocuments(filter),
      PaymentOrder.find(filter)
        .populate("book", "title coverImage isPaid price")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      total,
      page,
      limit,
      orders: orders.map((o) => serializeOrder(o)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/me/purchases
const listMyPurchases = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const [total, purchases] = await Promise.all([
      Purchase.countDocuments({ user: userId }),
      Purchase.find({ user: userId })
        .populate("book", "title author category coverImage isPaid price")
        .sort({ purchasedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({
      total,
      page,
      limit,
      purchases: purchases.map((p) => ({
        id: String(p._id),
        purchasedAt: p.purchasedAt ?? p.createdAt,
        expiresAt: p.expiresAt ?? null,
        isExpired: Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= Date.now()),
        book: serializeBookRef(p.book),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBookCheckout,
  confirmDummyOrderPayment,
  getOrder,
  listMyOrders,
  listMyPurchases,
};
