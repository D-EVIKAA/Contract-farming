const path = require("path");
module.paths.push(path.join(__dirname, "backend", "node_modules"));
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "backend/.env") });

const connectDB = require("./backend/config/db");
const authRoutes = require("./backend/routes/authRoutes");
const userRoutes = require("./backend/routes/userRoutes");
const User = require("./backend/models/User");

const TEST_PORT = 5007;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runAadhaarTests() {
  console.log("=== STARTING AADHAAR IDENTITY VERIFICATION MODULE TESTS ===");

  await connectDB();
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);

  const server = app.listen(TEST_PORT);
  console.log(`Test server running on ${BASE_URL}`);

  let testResults = [];

  function record(testName, success, details) {
    console.log(`[${success ? "PASS" : "FAIL"}] ${testName} ${details ? "- " + details : ""}`);
    testResults.push({ testName, success, details });
  }

  try {
    const testAadhaar = "987654321012";
    const testEmail = "aadhaarfarmer@test.com";

    // Clean up test user if exists
    await User.deleteMany({ email: { $in: [testEmail, "unverifiedfarmer@test.com"] } });

    // 1. Send OTP with invalid Aadhaar format (< 12 digits)
    const invalidFormatRes = await fetch(`${BASE_URL}/api/auth/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: "12345" }),
    });
    record("1. Send Demo OTP Format Validation (Reject < 12 digits)", invalidFormatRes.status === 400);

    // 2. Send OTP with valid 12-digit Aadhaar
    const sendOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar }),
    });
    const sendOtpData = await sendOtpRes.json();
    record(
      "2. Send Demo OTP Success (Valid 12-digit Aadhaar)",
      sendOtpRes.status === 200 && sendOtpData.success === true,
      `Notice: ${sendOtpData.demoOtpNotice}`
    );

    // 3. Verify OTP with invalid OTP
    const wrongOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, otp: "999999" }),
    });
    record("3. Verify Demo OTP Failure (Invalid OTP '999999')", wrongOtpRes.status === 400);

    // 4. Verify OTP with valid demo OTP "123456"
    const validOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, otp: "123456" }),
    });
    const validOtpData = await validOtpRes.json();
    record(
      "4. Verify Demo OTP Success (Valid OTP '123456')",
      validOtpRes.status === 200 && validOtpData.aadhaarVerified === true && validOtpData.aadhaarLast4 === "1012"
    );

    // 5. Registration with unverified Aadhaar (different unverified Aadhaar number)
    const unverifiedRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Unverified Farmer",
        email: "unverifiedfarmer@test.com",
        password: "password123",
        role: "farmer",
        aadhaar: "111122223333", // not OTP-verified yet
      }),
    });
    record(
      "5. Registration Blocked for Unverified Aadhaar",
      unverifiedRegRes.status === 400,
      "Blocked correctly with 400 Bad Request"
    );

    // 6. Registration with verified Aadhaar
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aadhaar Farmer",
        email: testEmail,
        password: "password123",
        role: "farmer",
        phone: "9988776655",
        address: "Village Green",
        aadhaar: testAadhaar,
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    record(
      "6. Registration Completed with Verified Aadhaar",
      regRes.status === 201 && regData.user?.aadhaarVerified === true && regData.user?.aadhaarLast4 === "1012"
    );

    // 7. Security Check: Raw Aadhaar or aadhaarHash not returned in API payload
    const rawExposed = regData.user?.aadhaar || regData.user?.aadhaarHash;
    record(
      "7. Security Check: Raw Aadhaar & aadhaarHash excluded from registration response",
      !rawExposed,
      `Only masked last4 exposed: ${regData.user?.aadhaarLast4}`
    );

    // 8. Attempt Duplicate Aadhaar Registration / OTP Request
    const dupOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar }),
    });
    const dupOtpData = await dupOtpRes.json();
    record(
      "8. Duplicate Aadhaar Prevention (Send OTP for linked Aadhaar)",
      dupOtpRes.status === 400 && dupOtpData.message?.includes("already linked"),
      dupOtpData.message
    );

    // 9. Login using 12-digit Aadhaar Number + Password
    const aadhaarLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testAadhaar, // Passing 12-digit Aadhaar number as login identifier
        password: "password123",
      }),
    });
    const aadhaarLoginData = await aadhaarLoginRes.json();
    record(
      "9. Login Using 12-digit Aadhaar Number + Password",
      aadhaarLoginRes.status === 200 && aadhaarLoginData.user?.aadhaarLast4 === "1012",
      `Logged in user: ${aadhaarLoginData.user?.name}`
    );

    // Clean up test users
    await User.deleteMany({ email: { $in: [testEmail, "unverifiedfarmer@test.com"] } });

    console.log("\n=== AADHAAR TEST RESULTS SUMMARY ===");
    const passedCount = testResults.filter((t) => t.success).length;
    console.log(`TOTAL PASSED: ${passedCount} / ${testResults.length}`);
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log("Test server closed and DB disconnected.");
  }
}

runAadhaarTests();
