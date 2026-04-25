# Akshar Shelf

A full-stack book reading platform built with MERN stack (MongoDB, Express.js, React, Node.js).

## Features

**User Features:**
- Browse and read books (free & paid)
- Purchase books with dummy payment system
- Manage bookshelf (Reading/Completed/Planned)
- Write reviews and ratings
- Get personalized recommendations (content-based & collaborative)
- Receive notifications (security alerts & admin announcements)

**Admin Features:**
- User management (block/unblock/delete)
- Book management (add/edit/delete with PDF & cover upload)
- Review moderation
- Send notifications to users
- View payments and revenue statistics

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Frontend:** React, Vite, Tailwind CSS
- **Auth:** JWT

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)

### Setup

1. **Clone and install:**
```bash
git clone <repository-url>
cd akshar-shelf

# Backend
cd server
npm install

# Frontend (new terminal)
cd client/frontend
npm install
```

2. **Configure backend** - Create `server/.env`:
```env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/ebookdb
JWT_SECRET=your_strong_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

3. **Start MongoDB:**
```bash
mongod
# or
sudo systemctl start mongod
```

4. **Run the application:**
```bash
# Backend (from server/)
npm run dev

# Frontend (from client/frontend/)
npm run dev
```

5. **Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Admin Login: http://localhost:5173/admin/login (admin/admin123)

## Project Structure

```
akshar-shelf/
├── server/                 # Backend (Express API)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── controllers/       # Request handlers
│   ├── uploads/           # PDF & image files
│   └── .env              # Environment config
└── client/frontend/       # Frontend (React)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/      # API calls
    └── public/
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - User login
- `POST /api/admin/login` - Admin login

### Books
- `GET /api/books` - List books
- `GET /api/books/:id` - Book details
- `GET /api/books/:id/read` - Read PDF (auth required for paid books)

### Payments (Dummy)
- `POST /api/payments/books/:bookId/checkout` - Create order
- `POST /api/payments/orders/:orderId/confirm` - Confirm payment
- Test card: `4242424242424242` (success), `4000000000000002` (decline)

### Bookshelf
- `GET /api/bookshelf` - Get user's shelf
- `POST /api/bookshelf/:bookId` - Add to shelf
- `PUT /api/bookshelf/:bookId` - Update status

### Reviews
- `GET /api/reviews/book/:bookId` - Get reviews
- `POST /api/reviews/:bookId` - Create review

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/read-all` - Mark all read

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/books` - Add book
- `POST /api/admin/notifications` - Send notification
- `GET /api/admin/payments/orders` - View orders & revenue

## Recommendations

The platform includes two recommendation algorithms:

1. **Content-Based** (`GET /api/books/:id/recommendations`)
   - Matches books by category, author, and content similarity

2. **Collaborative** (`GET /api/books/:id/recommendations/collaborative`)
   - Recommends based on what similar users read/viewed

## Payment System

**Dummy payment for demonstration only.** In production, integrate a real payment provider.

**How it works:**
- Server calculates price (prevents tampering)
- Creates order with `clientSecret`
- User confirms with test card
- Book unlocks automatically via Purchase record

**Access control:**
- Reading endpoint checks Purchase records
- Direct PDF access also protected

## Notifications

**System notifications:** Automatic security alerts (e.g., password changes)

**Admin notifications:** Send to all users or specific users
```json
{
  "audience": "all",
  "level": "info",
  "title": "Notice",
  "message": "Maintenance at 2 AM"
}
```

## Important Notes

⚠️ **Security:**
- Change `JWT_SECRET` to a strong random value
- Never commit `.env` files
- Use HTTPS in production
- Implement real payment gateway for production

⚠️ **Production:**
- Enable MongoDB authentication
- Set up proper CORS policies
- Implement rate limiting
- Use environment-based configurations

