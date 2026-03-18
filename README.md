# eBook Platform (Akshar Shelf)

A simple eBook platform built with:
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Vite + Tailwind

It supports free books, paid books (dummy payment), reading progress, bookmarks/shelf, reviews, and 2 recommendation algorithms.

## What you can do (features)

User side:
- Browse books, view details, read PDFs
- Paid books: buy/unlock and then read
- Bookshelf statuses: reading / completed / planned
- Bookmarks
- Reviews and ratings
- Profile page (including a Payments section)
- Recommendations: content-based + collaborative

Admin panel:
- Admin login
- Manage users (block/unblock/delete)
- Manage books (add/edit/delete + upload PDF/cover)
- Manage reviews (view/delete)
- Payments page (orders + purchases + revenue stats)

## Project structure

- `server/` Express API + MongoDB models
- `client/frontend/` React app
- `server/uploads/` uploaded PDFs and images (served at `/uploads`)

## Requirements

- Node.js
- MongoDB

## Server configuration (.env)

Create/update `server/.env`:

- `PORT=3000`
- `MONGO_URL=mongodb://127.0.0.1:27017/ebookdb`
- `JWT_SECRET=your_secret_here` (used by both user JWT and admin JWT)
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin123`

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

Frontend calls the API at `http://localhost:3000/api` (see `client/frontend/src/services/api.jsx`).

## Important routes (quick map)

Books:
- `GET /api/books` list books
- `GET /api/books/:id` book detail (includes `access.canRead`)
- `GET /api/books/:id/read` read/download PDF (protected for paid books)

Recommendations:
- `GET /api/books/:id/recommendations` content-based
- `GET /api/books/:id/recommendations/collaborative` collaborative

Dummy payments (user must be logged in):
- `POST /api/payments/books/:bookId/checkout` create/return an order
- `POST /api/payments/orders/:orderId/confirm` confirm dummy payment and unlock
- `GET /api/payments/me/orders` my recent orders
- `GET /api/payments/me/purchases` my purchases

Admin:
- `POST /api/admin/login`
- `GET /api/admin/payments/orders` orders + revenue stats
- `GET /api/admin/payments/purchases` purchases list

## Paid books: how access works (dummy payment)

The goal is: buying 1 book should unlock ONLY that 1 book.

This project enforces that in 2 places:

1) Reading endpoint (main protection)
- The reader loads PDFs from `GET /api/books/:id/read`
- If the book is paid, the server checks for a `Purchase` record for (user, book)

2) Direct `/uploads/*.pdf` protection (extra protection)
- Some book PDFs are stored as `/uploads/<filename>.pdf`
- A guard blocks direct PDF download unless the user purchased that book (or is admin)

### Checkout flow (dummy)

1) Create a checkout order
- `POST /api/payments/books/:bookId/checkout`
- Server calculates price from the `Book` document (client cannot change price)
- Creates a `PaymentOrder` with status `pending`

2) Confirm payment (simulated)
- `POST /api/payments/orders/:orderId/confirm`
- Requires `clientSecret` + card-like fields
- On success: order becomes `paid` and a `Purchase` record is upserted

Test cards:
- `4242424242424242` = success
- `4000000000000002` = decline

### Why these payment pieces exist (short)

- Server-calculated amount: stops price tampering
- Idempotency key: safe retries/refresh
- Client secret: prevents guessing other users' order IDs
- Purchase record: the single source of truth for reading access

## Recommendation system (easy explanation)

This project offers 2 recommendation types per book.

### 1) Content-based recommendations

Endpoint:
- `GET /api/books/:id/recommendations`

How it works:
- Looks for books with the same category and/or author
- Also compares text tokens from title/description/category/author
- Returns a score and short reasons (example: "Same category")

### 2) Collaborative recommendations

Endpoint:
- `GET /api/books/:id/recommendations/collaborative`

How it works:
- Tracks user activity in `BookActivity` (viewedAt/readAt)
- Finds users who viewed/read the target book
- Recommends other books those users also viewed/read
- Reads are weighted higher than views (stronger intent)
- If not enough activity: falls back to popular books

## Notes for production (important)

- Payment is dummy: for real payments you must integrate a real provider and never handle raw card data on your own server.
- Keep `JWT_SECRET` private and strong.
- Consider storing API base URL in environment configs for deployment.
