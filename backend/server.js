const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contractRoutes = require("./routes/contractRoutes");
const disputeRoutes = require("./routes/disputeRoutes");

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // allows Express to read JSON request bodies

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

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
