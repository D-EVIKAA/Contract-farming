const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contractRoutes = require("./routes/contractRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" })); // allows Express to read JSON request bodies up to 15MB
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Ensure DB is connected before handling any API request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// Static file serving for uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health-check route — confirms the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is up and running" });
});

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

// Catch-all for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Express error handling middleware (handles Multer errors, file size/type errors, etc.)
app.use((err, req, res, next) => {
  if (err) {
    const statusCode = err.status || err.statusCode || 400;
    return res.status(statusCode).json({
      message: err.message || "File upload or server error",
      error: err.message,
    });
  }
  next();
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
