const mongoose = require("mongoose");

// Connects to MongoDB using the connection string from .env
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured in environment variables");
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1); // stop the server if DB connection fails in standalone mode
    }
    throw error;
  }
};

module.exports = connectDB;
