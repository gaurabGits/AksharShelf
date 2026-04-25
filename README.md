# 📚 Akshar Shelf

<div align="center">

**A modern, full-stack reading platform for book lovers**

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=flat-square)](https://www.mongodb.com/mern-stack)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-v18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

Akshar Shelf is a comprehensive book reading platform that combines powerful book management with intelligent recommendations. Built with the MERN stack, it offers a seamless experience for readers to discover, purchase, and enjoy their favorite books while providing administrators with robust tools to manage the platform.

### ✨ Highlights

- 🔐 **Secure Authentication** - JWT-based user and admin authentication
- 💳 **Payment Integration** - Simulated payment system with purchase management
- 📊 **Smart Recommendations** - Content-based and collaborative filtering algorithms
- 🎨 **Modern UI** - Built with React, Vite, and Tailwind CSS
- 📱 **In-App Notifications** - Real-time security alerts and admin announcements
- 👤 **User Profiles** - Track reading progress, bookmarks, and purchase history
- 🛠️ **Admin Dashboard** - Comprehensive management tools for users, books, and payments

---

## 🚀 Features

### For Readers

<table>
<tr>
<td width="50%">

#### 📚 **Book Management**
- Browse and search books
- View detailed book information
- Read PDF books in-browser
- Track reading progress
- Organize books by status (Reading/Completed/Planned)
- Bookmark favorite books

</td>
<td width="50%">

#### 💰 **Purchasing & Access**
- Free and paid books
- Secure checkout process
- Instant book unlocking after purchase
- View purchase history
- Track payment orders

</td>
</tr>
<tr>
<td width="50%">

#### ⭐ **Reviews & Ratings**
- Rate books (1-5 stars)
- Write detailed reviews
- View community ratings
- Filter reviews by rating

</td>
<td width="50%">

#### 🎯 **Personalized Experience**
- Content-based recommendations
- Collaborative filtering suggestions
- Personalized book feed
- Activity tracking

</td>
</tr>
<tr>
<td colspan="2">

#### 🔔 **Notifications**
- Security alerts (password changes)
- Admin announcements
- Unread notification badges
- Read/delete notification management

</td>
</tr>
</table>

### For Administrators

<table>
<tr>
<td width="50%">

#### 👥 **User Management**
- View all registered users
- Block/unblock users
- Delete user accounts
- Send targeted notifications

</td>
<td width="50%">

#### 📖 **Book Management**
- Add new books with PDF upload
- Edit book details
- Upload/change book covers
- Delete books

</td>
</tr>
<tr>
<td width="50%">

#### 💬 **Review Moderation**
- View all user reviews
- Delete inappropriate reviews
- Monitor rating distribution

</td>
<td width="50%">

#### 📊 **Analytics**
- View payment orders
- Track purchases
- Revenue statistics
- User activity insights

</td>
</tr>
<tr>
<td colspan="2">

#### 📢 **Communication**
- Send notifications to all users
- Target specific users
- View sent notification history
- Track notification read rates

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Security:** bcrypt for password hashing

### Frontend
- **Library:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Routing:** React Router
- **PDF Viewer:** React PDF libraries

### Development Tools
- **Code Quality:** ESLint
- **Environment:** dotenv
- **API Testing:** Postman/Thunder Client

---

## 📁 Project Structure

```
akshar-shelf/
├── server/                      # Backend application
│   ├── config/                  # Configuration files
│   ├── controllers/             # Request handlers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── uploads/                 # Uploaded files (PDFs, images)
│   ├── .env                     # Environment variables
│   ├── server.js                # Express server entry point
│   └── package.json
│
├── client/frontend/             # Frontend application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx              # Main App component
│   │   └── main.jsx             # React entry point
│   ├── public/                  # Static assets
│   ├── index.html
│   └── package.json
│
└── README.md                    # This file
```

---

## 🔧 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/akshar-shelf.git
cd akshar-shelf
```

### Step 2: Backend Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `server/.env`:
   ```env
   PORT=3000
   MONGO_URL=mongodb://127.0.0.1:27017/ebookdb
   JWT_SECRET=your_strong_secret_key_here_change_in_production
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

   > ⚠️ **Important:** Change `JWT_SECRET` to a strong, random value in production!

5. **Start MongoDB:**
   ```bash
   # If MongoDB is installed as a service
   sudo systemctl start mongod
   
   # Or run directly
   mongod --dbpath /path/to/your/data/directory
   ```

6. **Run the backend server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

   The server will start at `http://localhost:3000`

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd client/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will start at `http://localhost:5173` (default Vite port)

### Step 4: Access the Application

- **User Interface:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin/login
  - Username: `admin`
  - Password: `admin123`

---

## 🎯 Quick Start Guide

### Creating Your First User Account

1. Navigate to the registration page
2. Fill in your details (username, email, password)
3. Click "Sign Up"
4. Log in with your credentials

### Browsing Books

1. Visit the home page to see all available books
2. Click on a book to view details
3. Free books can be read immediately
4. Paid books require purchase first

### Making a Purchase (Dummy Payment)

1. Click on a paid book
2. Click "Buy Now" or "Checkout"
3. Use test card: `4242424242424242`
4. Complete the checkout process
5. Book will be unlocked automatically

### Admin Access

1. Go to `/admin/login`
2. Login with admin credentials
3. Access all admin features from the dashboard

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/profile` | Get user profile | Yes |
| PUT | `/auth/profile` | Update profile | Yes |
| PUT | `/auth/profile/password` | Change password | Yes |

#### 📖 Books

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/books` | List all books | No |
| GET | `/books/:id` | Get book details | No |
| GET | `/books/:id/read` | Read/download PDF | Yes (for paid) |
| GET | `/books/:id/recommendations` | Content-based recommendations | No |
| GET | `/books/:id/recommendations/collaborative` | Collaborative recommendations | No |

#### 📚 Bookshelf

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bookshelf` | Get user's bookshelf | Yes |
| POST | `/bookshelf/:bookId` | Add book to shelf | Yes |
| PUT | `/bookshelf/:bookId` | Update shelf status | Yes |
| DELETE | `/bookshelf/:bookId` | Remove from shelf | Yes |

#### ⭐ Reviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/reviews/book/:bookId` | Get book reviews | No |
| POST | `/reviews/:bookId` | Create review | Yes |
| PUT | `/reviews/:reviewId` | Update review | Yes |
| DELETE | `/reviews/:reviewId` | Delete review | Yes |

#### 💳 Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments/books/:bookId/checkout` | Create checkout order | Yes |
| POST | `/payments/orders/:orderId/confirm` | Confirm payment | Yes |
| GET | `/payments/me/orders` | Get my orders | Yes |
| GET | `/payments/me/purchases` | Get my purchases | Yes |

#### 🔔 Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | List notifications | Yes |
| GET | `/notifications/unread-count` | Get unread count | Yes |
| PATCH | `/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |

#### 🛡️ Admin

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/admin/login` | Admin login | No |
| GET | `/admin/users` | List all users | Admin |
| PUT | `/admin/users/:id/block` | Block user | Admin |
| DELETE | `/admin/users/:id` | Delete user | Admin |
| POST | `/admin/books` | Add new book | Admin |
| PUT | `/admin/books/:id` | Update book | Admin |
| DELETE | `/admin/books/:id` | Delete book | Admin |
| GET | `/admin/reviews` | Get all reviews | Admin |
| DELETE | `/admin/reviews/:id` | Delete review | Admin |
| POST | `/admin/notifications` | Send notification | Admin |
| GET | `/admin/notifications/sent` | Sent notifications | Admin |
| GET | `/admin/payments/orders` | All orders + stats | Admin |
| GET | `/admin/payments/purchases` | All purchases | Admin |

### Detailed Examples

<details>
<summary><b>User Registration</b></summary>

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```
</details>

<details>
<summary><b>Create Book Checkout</b></summary>

**Request:**
```http
POST /api/payments/books/65f.../checkout
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "65f...",
    "bookId": "65f...",
    "amount": 299,
    "status": "pending",
    "clientSecret": "order_secret_...",
    "createdAt": "2026-04-25T10:30:00Z"
  }
}
```
</details>

<details>
<summary><b>Confirm Payment</b></summary>

**Request:**
```http
POST /api/payments/orders/65f.../confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientSecret": "order_secret_...",
  "cardNumber": "4242424242424242",
  "expiryMonth": "12",
  "expiryYear": "2028",
  "cvv": "123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful",
  "order": {
    "status": "paid",
    "paidAt": "2026-04-25T10:35:00Z"
  },
  "purchase": {
    "bookId": "65f...",
    "purchasedAt": "2026-04-25T10:35:00Z"
  }
}
```

**Test Cards:**
- ✅ Success: `4242424242424242`
- ❌ Decline: `4000000000000002`
</details>

<details>
<summary><b>Send Admin Notification</b></summary>

**Request:**
```http
POST /api/admin/notifications
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "audience": "all",
  "category": "notice",
  "level": "info",
  "title": "Maintenance Notice",
  "message": "System maintenance scheduled for tonight at 2 AM.",
  "link": "/books"
}
```

**For specific users:**
```json
{
  "audience": "users",
  "userIds": ["65f...", "65g..."],
  "category": "notice",
  "level": "warning",
  "title": "Account Review",
  "message": "Please update your profile information."
}
```
</details>

---

## 🤖 Recommendation System

Akshar Shelf features two intelligent recommendation algorithms:

### 1. Content-Based Filtering

**Endpoint:** `GET /api/books/:id/recommendations`

**How it works:**
- Analyzes book metadata (category, author, title, description)
- Compares text tokens using similarity scoring
- Returns books with matching attributes
- Provides explanatory reasons for each recommendation

**Example reasons:**
- "Same category: Fiction"
- "Same author: J.K. Rowling"
- "Similar themes and topics"

### 2. Collaborative Filtering

**Endpoint:** `GET /api/books/:id/recommendations/collaborative`

**How it works:**
- Tracks user activity (views and reads)
- Identifies users who interacted with the target book
- Recommends other books those users enjoyed
- Weights reading activity higher than viewing
- Falls back to popular books when activity is sparse

**Activity weights:**
- Read activity: Higher weight (stronger intent)
- View activity: Lower weight (browsing interest)

---

## 💳 Payment System

### Overview

Akshar Shelf uses a **simulated payment system** for demonstration purposes. In production, integrate with a real payment provider (Stripe, PayPal, etc.).

### Security Features

| Feature | Purpose |
|---------|---------|
| **Server-calculated pricing** | Prevents client-side price tampering |
| **Idempotency keys** | Safe retries and page refreshes |
| **Client secrets** | Prevents unauthorized order access |
| **Purchase records** | Single source of truth for book access |

### Checkout Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browse    │────▶│   Checkout   │────▶│   Payment   │
│   Books     │     │   (Create    │     │   (Confirm  │
│             │     │    Order)    │     │    Order)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │   Unlock    │
                                         │    Book     │
                                         └─────────────┘
```

### Access Control

Books are protected at two levels:

1. **Reading Endpoint** (`/api/books/:id/read`)
   - Checks for valid Purchase record
   - Primary access control mechanism

2. **Direct PDF Access** (`/uploads/*.pdf`)
   - Additional guard against direct file access
   - Validates purchase before serving file

### Test Payment Cards

| Card Number | Result |
|-------------|--------|
| `4242424242424242` | ✅ Success |
| `4000000000000002` | ❌ Declined |

---

## 🔔 Notification System

### Features

- **Real-time Updates:** Unread count badges with auto-refresh
- **Categorized Notifications:** Security alerts, admin notices, system messages
- **Severity Levels:** Info, Warning, Critical
- **Action Tracking:** Read/unread status, read timestamps
- **User Control:** Mark as read, delete notifications

### Notification Types

#### System Notifications
- Password changed alerts
- Account security updates
- Automated system messages

#### Admin Notifications
- Platform announcements
- Maintenance notices
- Targeted user messages

### Notification Levels

| Level | Use Case | Example |
|-------|----------|---------|
| **Info** | General information | "New books added to the library" |
| **Warning** | Important updates | "Password changed successfully" |
| **Critical** | Urgent action required | "Suspicious login detected" |

---

## 🔒 Security Best Practices

### For Development

- ✅ Use strong, unique `JWT_SECRET`
- ✅ Never commit `.env` files to version control
- ✅ Use environment variables for sensitive data
- ✅ Implement rate limiting for authentication endpoints
- ✅ Validate and sanitize all user inputs

### For Production

- 🔐 Use HTTPS everywhere
- 🔐 Implement proper CORS policies
- 🔐 Use helmet.js for security headers
- 🔐 Enable MongoDB authentication
- 🔐 Regular security audits and updates
- 🔐 Implement proper logging and monitoring
- 🔐 Use production-grade payment providers
- 🔐 Never store raw card data

---

## 🐛 Troubleshooting

<details>
<summary><b>MongoDB Connection Error</b></summary>

**Problem:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `sudo systemctl status mongod`
2. Start MongoDB: `sudo systemctl start mongod`
3. Check connection string in `.env` file
4. Verify MongoDB is listening on the correct port
</details>

<details>
<summary><b>Port Already in Use</b></summary>

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
1. Find process using the port: `lsof -i :3000`
2. Kill the process: `kill -9 <PID>`
3. Or change the port in `.env`: `PORT=3001`
</details>

<details>
<summary><b>JWT Token Expired</b></summary>

**Problem:** `401 Unauthorized: Token expired`

**Solution:**
1. Log out and log in again to get a new token
2. Adjust token expiration time in backend configuration
3. Implement refresh token mechanism for production
</details>

<details>
<summary><b>PDF Not Loading</b></summary>

**Problem:** PDF viewer shows blank or error

**Solution:**
1. Check if PDF file exists in `server/uploads/`
2. Verify file permissions: `chmod 644 server/uploads/*.pdf`
3. Ensure user has purchased the book (for paid books)
4. Check browser console for CORS or network errors
</details>

<details>
<summary><b>Payment Always Fails</b></summary>

**Problem:** All test payments are declined

**Solution:**
1. Use the correct test card: `4242424242424242`
2. Ensure all required fields are filled
3. Check `clientSecret` matches the order
4. Verify user is authenticated
5. Check server logs for detailed error messages
</details>

---

## 🚀 Deployment

### Environment Setup

1. **Set production environment variables:**
   ```env
   NODE_ENV=production
   PORT=3000
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/ebookdb
   JWT_SECRET=<generate-strong-random-secret>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<strong-password>
   ```

2. **Build frontend:**
   ```bash
   cd client/frontend
   npm run build
   ```

3. **Configure backend to serve frontend:**
   Update `server/server.js` to serve the built frontend files

### Deployment Platforms

- **Backend:** Heroku, DigitalOcean, AWS EC2, Railway
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Database:** MongoDB Atlas (recommended)

### Recommended Stack

```
Frontend (Vercel/Netlify)
         ↓
Backend API (Heroku/Railway)
         ↓
MongoDB Atlas
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with descriptive messages:**
   ```bash
   git commit -m "Add: amazing new feature"
   ```
5. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Commit Message Convention

- `Add:` New features
- `Fix:` Bug fixes
- `Update:` Updates to existing features
- `Remove:` Removed features or files
- `Docs:` Documentation changes
- `Style:` Code style changes (formatting, etc.)
- `Refactor:` Code refactoring

### Code Style

- Follow existing code style and conventions
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused
- Write clean, readable code

---

## 👨‍💻 Author

**Gaurab**

- GitHub: [@gaurabGits](https://github.com/yourusername)
- Project: [Akshar Shelf](https://github.com/gaurabGits/akshar-shelf)

---

## 🙏 Acknowledgments

- MongoDB team for excellent documentation
- React community for helpful resources
- Tailwind CSS for the utility-first framework
- All contributors and testers

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/yourusername/akshar-shelf/issues)
3. Create a [new issue](https://github.com/yourusername/akshar-shelf/issues/new) with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, Node version, etc.)

---
### Future Enhancements

- Enhanced recommendation algorithms (deep learning)
- Book clubs and discussion forums
- Reading challenges and achievements
- Audiobook support
- Integration with external book APIs
- Progressive Web App (PWA) features

---

<div align="center">

**Made with ❤️ by Gaurab**

⭐ Star this repo if you find it helpful!

[Back to Top](#-akshar-shelf)

</div>