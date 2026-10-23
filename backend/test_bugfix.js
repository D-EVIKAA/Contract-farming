const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const User = require("./models/User");

const TEST_PORT = 5007;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runBugfixVerification() {
  console.log("=== STARTING FINAL BUG FIX VERIFICATION TESTS ===");

  await connectDB();
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);

  const server = app.listen(TEST_PORT);

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = "") {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name} ${details ? "- " + details : ""}`);
    } else {
      console.error(`[FAIL] ${name} ${details ? "- " + details : ""}`);
    }
  }

  try {
    // 1. Admin Login Verification
    const adminEmail = process.env.ADMIN_EMAIL || "admin@contractfarming.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    const adminRole = adminLoginData.user?.role;

    assert(
      "1. Admin Login (admin@contractfarming.com)",
      adminLoginRes.status === 200 && !!adminToken && adminRole === "admin",
      `Status: ${adminLoginRes.status}, Role: ${adminRole}`
    );

    // 2. Admin Stats Authorization with Admin Token
    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      "2. Admin Stats Access (GET /api/admin/stats)",
      adminStatsRes.status === 200,
      `Status: ${adminStatsRes.status}`
    );

    // 3. Buyer Registration & Profile Update Verification
    await User.deleteMany({ email: "bugfix_buyer@test.com" });

    const buyerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bugfix Buyer",
        email: "bugfix_buyer@test.com",
        password: "password123",
        role: "buyer",
        phone: "1112223333",
        businessName: "Initial Business",
      }),
    });
    const buyerRegData = await buyerRegRes.json();
    const buyerToken = buyerRegData.token;

    assert("3. Buyer Registration", buyerRegRes.status === 201 && !!buyerToken);

    // 4. Buyer Update Profile (PUT /api/users/me)
    const buyerUpdateRes = await fetch(`${BASE_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        name: "Updated Buyer Name",
        phone: "+91-9988776655",
        businessName: "AgriCorp Global Pvt Ltd",
      }),
    });
    const buyerUpdateData = await buyerUpdateRes.json();
    const updatedUser = buyerUpdateData.user;

    assert(
      "4. Buyer Profile Update (PUT /api/users/me)",
      buyerUpdateRes.status === 200 &&
        updatedUser?.businessName === "AgriCorp Global Pvt Ltd" &&
        updatedUser?.phone === "+91-9988776655",
      `Business: ${updatedUser?.businessName}, Phone: ${updatedUser?.phone}`
    );

    // 5. Fetch My Profile (GET /api/users/me)
    const getProfileRes = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const getProfileData = await getProfileRes.json();

    assert(
      "5. Get Profile Verification (GET /api/users/me)",
      getProfileRes.status === 200 &&
        getProfileData.user?.businessName === "AgriCorp Global Pvt Ltd" &&
        getProfileData.user?.phone === "+91-9988776655",
      `Business: ${getProfileData.user?.businessName}`
    );

    // Cleanup
    await User.deleteMany({ email: "bugfix_buyer@test.com" });

    console.log(`\nBUG FIX VERIFICATION RESULT: ${passed} / ${total} PASSED.`);
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runBugfixVerification();
