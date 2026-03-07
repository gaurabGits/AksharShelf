const express = require("express");
const cors = require("cors");
const connectDB = require('./config/db');
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes")
const path = require("path"); 

require("dotenv").config(); 

const app = express();

connectDB()

// Middleware
app.use(cors());  
app.use(express.json()); // For parsing application/json
app.use("/api/auth", authRoutes) //Keeps related routes grouped together (/api/auth/register)
app.use("/api/books", bookRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); //http://localhost:3000/uploads/filename.pdf



// Routes
app.get("/", (req, res) => {
  res.send("Ebook API Running");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
