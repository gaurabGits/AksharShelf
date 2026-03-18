# eBook Platform

Full-stack eBook platform (Express + MongoDB + React) with:
- Free + paid books (dummy payment flow)
- Reading access enforcement (purchase required for paid books)
- Content-based + collaborative recommendations
- Admin panel (users/books/reviews/payments)

## Requirements

- Node.js (server + client)
- MongoDB (local or remote)

## Environment variables

Server reads `server/.env`:

- `PORT` (example: `3000`)
- `MONGO_URL` (example: `mongodb://127.0.0.1:27017/ebookdb`)
- `JWT_SECRET` (used for both user JWT + admin JWT)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` (default admin bootstrap credentials)

## Run locally

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client/frontend
npm install
npm run dev
```

API base URL (frontend): `http://localhost:3000/api`

---

# Dummy payment system (paid books)

This project includes a **dummy** payment provider (`provider: "dummy"`) to simulate paid-book checkout with **professional security patterns**:

- **Server-calculated pricing**: the server reads `Book.price` from MongoDB; the client cannot override the amount.
- **Order records**: checkout creates a `PaymentOrder` record (`pending -> paid/failed/expired`).
- **Idempotency**: checkout supports an `Idempotency-Key` header so refresh/retries do not create duplicates.
- **Client secret**: each order has a `clientSecret` and confirmation requires it (prevents guessing order IDs).
- **Access unlock is separate**: a paid order upserts a `Purchase` record (unique per `user+book`) which is what unlocks reading.

> Important (real payments): this dummy flow accepts card-like fields only for simulation. In production you must use a payment provider (Stripe/Khalti/eSewa/etc.) and **never** send raw card data to your own server; use provider tokenization/SDKs.

## Data models (MongoDB)

- `Book` (`server/models/book.js`): `isPaid`, `price`
- `PaymentOrder` (`server/models/paymentOrder.js`):
  - `status`: `pending | paid | failed | expired`
  - `amountMinor`: integer amount in minor units (price x 100)
  - `idempotencyKey`: unique per user
  - `clientSecret`: stored in DB (not returned by default unless selected)
  - `expiresAt`: order expires after ~15 minutes
- `Purchase` (`server/models/Purchase.js`):
  - unique index `{ user, book }`

## Access enforcement (paid book read)

Reading a paid book requires a `Purchase`:

- Book details returns `access.canRead` (`GET /api/books/:id`)
- PDF reading endpoint blocks non-purchased users (`GET /api/books/:id/read`)

## User payment API (dummy provider)

All payment routes require a logged-in user (`Authorization: Bearer <token>`).

### 1) Create checkout order

`POST /api/payments/books/:bookId/checkout`

Optional header:
- `Idempotency-Key: <any unique string>`

Response includes:
- `order.id` (order id)
- `order.clientSecret` (used for confirm)
- `order.amount` (derived from server price)

### 2) Confirm payment (simulated)

`POST /api/payments/orders/:orderId/confirm`

Body example:

```json
{
  "clientSecret": "...from checkout...",
  "paymentMethod": {
    "cardNumber": "4242424242424242",
    "expMonth": 12,
    "expYear": 2030,
    "cvc": "123"
  }
}
```

Test outcomes:
- `4242424242424242` -> success (creates `Purchase`)
- `4000000000000002` -> decline (`failed`)

## Admin payment visibility

Admin JWT routes (admin panel uses `Authorization: Bearer <adminToken>`):

- `GET /api/admin/payments/orders` (query: `status`, `page`, `limit`, `bookId`, `userId`)
- `GET /api/admin/payments/purchases` (query: `page`, `limit`, `bookId`, `userId`)

Admin UI page:
- `/admin/payments` (shows latest orders + purchases)

---

# Recommendation system

This project ships **two** recommendation endpoints for each book:

1) **Content-based** (metadata similarity)
2) **Collaborative** (user activity co-occurrence)

Both endpoints return books with a `recommendation` object containing:
- `algorithm`: `"content_based"` or `"collaborative"`
- `score`: numeric score used for ordering
- `reasons`: short human-readable reasons (used in UI if needed)

## 1) Content-based recommendations

Route:
- `GET /api/books/:id/recommendations?limit=10`

How it works (`server/utils/recommendations/contentBased.js`):
- Normalizes and tokenizes `title + description + category + author`
- Computes a cosine-like overlap score on tokens
- Adds strong boosts for exact normalized matches:
  - `Same category` has the highest weight
  - `Same author` has the next weight
  - Text similarity adds a smaller weight

Candidate pool strategy (`server/controllers/bookController.js`):
- Prefer same category and same author
- If not enough candidates, fall back to popular books (reads/views)

## 2) Collaborative recommendations

Route:
- `GET /api/books/:id/recommendations/collaborative?limit=12`

Signals used:
- `viewedAt` and `readAt` events stored in `BookActivity` (`server/models/bookActivity.js`)

How it works (`server/utils/recommendations/collaborativeFiltering.js`):
- Finds up to `maxUsers` users who viewed/read the target book
- Aggregates other books those users also viewed/read
- Per-activity weighting:
  - `readAt` counts more than `viewedAt` (stronger intent)
- Sorts by total score, then readers, then viewers

Fallback:
- If there is not enough activity, returns "Popular right now" books (reads/views)
