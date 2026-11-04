const mongoose = require("mongoose");

// Connects to MongoDB using the connection string from .env
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1); // stop the server if DB connection fails in standalone mode
    }
  }
};

module.exports = connectDB;
