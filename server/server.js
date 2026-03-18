const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
const seedDefaultAdmin = require('./utils/seedAdmin');
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes")
const adminRoutes = require("./routes/adminRoutes")
const bookshelfRoutes = require("./routes/bookshelfRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadsGuard = require("./middleware/uploadsGuard");
const path = require("path"); 

require("dotenv").config(); 

const app = express();

// Middleware
app.use(cors());  
app.use(express.json({ limit: "50mb" })); // Allow base64 PDF/image payloads from admin upload
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


//Admin routes
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes); //Keeps related routes grouped together (/api/auth/register)
app.use("/api/books", bookRoutes);
app.use("/api/bookshelf", bookshelfRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/uploads", uploadsGuard, express.static(path.join(__dirname, "uploads"))); // public images; PDFs gated for paid books



// Routes
app.get("/", (req, res) => {
  res.send("Ebook API Running");
});

app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Uploaded file is too large. Please choose a smaller PDF/image.",
    });
  }

  return next(err);
});

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultAdmin();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
