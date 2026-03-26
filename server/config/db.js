const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = async () =>{
    try {
        const mongoUrl =
          process.env.MONGO_URL ||
          process.env.MONGODB_URI ||
          process.env.DATABASE_URL;

        if (!mongoUrl || typeof mongoUrl !== "string") {
          throw new Error(
            "Missing MongoDB connection string. Set MONGO_URL (or MONGODB_URI/DATABASE_URL) in your environment variables."
          );
        }

        await mongoose.connect(mongoUrl);
        console.log("MongoDb Connected");
    } catch (error) {
        console.log("MongoDB Error:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB; 
