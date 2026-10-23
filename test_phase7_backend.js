const path = require("path");
module.paths.push(path.join(__dirname, "backend", "node_modules"));
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "backend/.env") });

const connectDB = require("./backend/config/db");
const authRoutes = require("./backend/routes/authRoutes");
const userRoutes = require("./backend/routes/userRoutes");
const contractRoutes = require("./backend/routes/contractRoutes");
const disputeRoutes = require("./backend/routes/disputeRoutes");

const User = require("./backend/models/User");
const Contract = require("./backend/models/Contract");
const Dispute = require("./backend/models/Dispute");

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log("=== STARTING PHASE 7 BACKEND INTEGRATION TESTS ===");

  // Setup Express server for testing
  await connectDB();
  const app = express();
  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "backend/uploads")));
  app.get("/api/health", (req, res) => res.status(200).json({ status: "OK" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/contracts", contractRoutes);
  app.use("/api/disputes", disputeRoutes);

  const server = app.listen(TEST_PORT);
  console.log(`Test server running on ${BASE_URL}`);

  let testResults = [];

  function record(testName, success, details) {
    console.log(`[${success ? "PASS" : "FAIL"}] ${testName} ${details ? "- " + details : ""}`);
    testResults.push({ testName, success, details });
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    record("1. Health Check Endpoint", healthRes.ok, `Status ${healthRes.status}`);

    // Clean up existing test users
    await User.deleteMany({ email: { $in: ["p7farmer@test.com", "p7buyer@test.com", "p7admin@test.com"] } });

    // 2. Register Farmer
    const farmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase7 Farmer",
        email: "p7farmer@test.com",
        password: "password123",
        role: "farmer",
        phone: "1234567890",
        address: "Green Farm Lane",
        farmDetails: { farmSize: "10 Acres", soilType: "Loam", cropsGrown: "Wheat" },
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    const farmerToken = farmerRegData.token;
    const farmerId = farmerRegData.user?.id;
    record("2. Farmer Registration", farmerRegRes.status === 201 && !!farmerToken, `Farmer ID: ${farmerId}`);

    // 3. Register Buyer
    const buyerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase7 Buyer",
        email: "p7buyer@test.com",
        password: "password123",
        role: "buyer",
        phone: "0987654321",
        address: "Market Street",
        businessName: "AgriCorp",
      }),
    });
    const buyerRegData = await buyerRegRes.json();
    const buyerToken = buyerRegData.token;
    const buyerId = buyerRegData.user?.id;
    record("3. Buyer Registration", buyerRegRes.status === 201 && !!buyerToken, `Buyer ID: ${buyerId}`);

    // 4. Create Admin account in DB & Login
    const bcrypt = require("bcryptjs");
    const adminHashed = await bcrypt.hash("password123", 10);
    const adminUser = await User.create({
      name: "Phase7 Admin",
      email: "p7admin@test.com",
      password: adminHashed,
      role: "admin",
      isActive: true,
    });
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "p7admin@test.com", password: "password123" }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    record("4. Admin User Creation & Login", adminLoginRes.status === 200 && !!adminToken);

    // 5. Contract Creation Validation: missing farmerId
    const missingFarmerRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        cropName: "Organic Wheat",
        quantity: 100,
        pricePerUnit: 50,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        location: "Warehouse A",
      }),
    });
    record("5. Create Contract without farmerId (Validation Check)", missingFarmerRes.status === 400, "Blocked correctly with 400 Bad Request");

    // 6. Contract Creation Validation: non-farmer ID
    const invalidFarmerRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        farmerId: buyerId, // passing buyer's ID instead of farmer's ID
        cropName: "Organic Wheat",
        quantity: 100,
        pricePerUnit: 50,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        location: "Warehouse A",
      }),
    });
    record("6. Create Contract with non-farmer ID (Validation Check)", invalidFarmerRes.status === 400, "Blocked correctly with 400 Bad Request");

    // 7. Successful Contract Creation with valid farmerId
    const validContractRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        farmerId: farmerId,
        cropName: "Organic Wheat",
        quantity: 100,
        pricePerUnit: 50,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        location: "Warehouse A",
        additionalRequirements: "Grade A quality",
      }),
    });
    const validContractData = await validContractRes.json();
    const contractId = validContractData.contract?._id;
    const initialStatus = validContractData.contract?.status;
    record(
      "7. Create Contract with REQUIRED farmerId",
      validContractRes.status === 201 && initialStatus === "Pending" && validContractData.contract?.farmer === farmerId,
      `Contract Created ID: ${contractId}, Status: ${initialStatus}`
    );

    // 8. Role Authorization Check: Buyer tries to accept contract
    const buyerAcceptRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("8. Security Check: Buyer attempts Accept", buyerAcceptRes.status === 403, "Blocked with 403 Forbidden");

    // 9. Farmer Accepts Proposal: Pending -> Accepted
    const acceptRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const acceptData = await acceptRes.json();
    record("9. Farmer Accepts Contract (Pending -> Accepted)", acceptRes.status === 200 && acceptData.contract?.status === "Accepted");

    // 10. Farmer Progress Update: Accepted -> In Progress
    const formData = new FormData();
    formData.append("note", "Sowed seeds successfully");
    // Attach dummy text blob as image
    const dummyBlob = new Blob(["dummy image content"], { type: "image/png" });
    formData.append("image", dummyBlob, "progress.png");

    const progressRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/progress`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: formData,
    });
    const progressData = await progressRes.json();
    record("10. Farmer Adds Progress & Uploads Photo (Accepted -> In Progress)", progressRes.status === 200 && progressData.contract?.status === "In Progress");

    // 11. Farmer Marks Ready for Delivery: In Progress -> Ready for Delivery
    const readyRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/ready`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const readyData = await readyRes.json();
    record("11. Farmer Marks Ready (In Progress -> Ready for Delivery)", readyRes.status === 200 && readyData.contract?.status === "Ready for Delivery");

    // 12. Farmer Dispatches Contract: Ready for Delivery -> Dispatched
    const dispatchRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/dispatch`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const dispatchData = await dispatchRes.json();
    record("12. Farmer Dispatches Crop (Ready for Delivery -> Dispatched)", dispatchRes.status === 200 && dispatchData.contract?.status === "Dispatched");

    // 13. Buyer Confirms Delivery: Dispatched -> Delivered
    const confirmDeliveryRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-delivery`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const confirmDeliveryData = await confirmDeliveryRes.json();
    record("13. Buyer Confirms Delivery (Dispatched -> Delivered)", confirmDeliveryRes.status === 200 && confirmDeliveryData.contract?.status === "Delivered");

    // 14. Buyer Completes Contract: Delivered -> Completed
    const completeRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/complete`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const completeData = await completeRes.json();
    record("14. Buyer Completes Contract (Delivered -> Completed)", completeRes.status === 200 && completeData.contract?.status === "Completed");

    // 15. Buyer Initiates Payment: Pending -> Initiated
    const initiatePayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/initiate-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const initiatePayData = await initiatePayRes.json();
    record("15. Buyer Initiates Payment (Pending -> Initiated)", initiatePayRes.status === 200 && initiatePayData.contract?.paymentStatus === "Initiated");

    // 16. Security Check: Buyer attempts Confirm Payment
    const buyerConfirmPayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("16. Security Check: Buyer attempts Confirm Payment", buyerConfirmPayRes.status === 403, "Blocked with 403 Forbidden");

    // 17. Farmer Confirms Payment Receipt: Initiated -> Paid
    const confirmPayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const confirmPayData = await confirmPayRes.json();
    record("17. Farmer Confirms Payment Receipt (Initiated -> Paid)", confirmPayRes.status === 200 && confirmPayData.contract?.paymentStatus === "Paid");

    // 18. Profile Photo Uploads
    const profileForm = new FormData();
    profileForm.append("image", new Blob(["profile pic"], { type: "image/jpeg" }), "profile.jpg");
    const profileUploadRes = await fetch(`${BASE_URL}/api/users/me/profile-picture`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: profileForm,
    });
    record("18. Profile Picture Upload", profileUploadRes.status === 200);

    // 19. Dispute System: Create Dispute
    const disputeCreateRes = await fetch(`${BASE_URL}/api/disputes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        contractId: contractId,
        title: "Minor delay in documentation",
        description: "Contract completed successfully but documents were delayed by 1 day.",
      }),
    });
    const disputeCreateData = await disputeCreateRes.json();
    const disputeId = disputeCreateData.dispute?._id;
    record("19. Create Dispute", disputeCreateRes.status === 201 && disputeCreateData.dispute?.status === "Open", `Dispute ID: ${disputeId}`);

    // 20. Dispute System: User update status check (Security Block)
    const userDisputeUpdateRes = await fetch(`${BASE_URL}/api/disputes/${disputeId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ status: "Resolved", resolutionDetails: "Self resolved" }),
    });
    record("20. Security Check: Normal user attempts Dispute Resolution", userDisputeUpdateRes.status === 403, "Blocked with 403 Forbidden");

    // 21. Dispute System: Admin Updates Status
    const adminDisputeUpdateRes = await fetch(`${BASE_URL}/api/disputes/${disputeId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "Resolved", resolutionDetails: "Resolved after review by Admin" }),
    });
    const adminDisputeUpdateData = await adminDisputeUpdateRes.json();
    record("21. Admin Dispute Status Update", adminDisputeUpdateRes.status === 200 && adminDisputeUpdateData.dispute?.status === "Resolved");

    console.log("\n=== TEST RESULTS SUMMARY ===");
    const passedCount = testResults.filter((t) => t.success).length;
    console.log(`TOTAL PASSED: ${passedCount} / ${testResults.length}`);

    // Clean up test documents
    if (contractId) await Contract.findByIdAndDelete(contractId);
    if (disputeId) await Dispute.findByIdAndDelete(disputeId);
    await User.deleteMany({ email: { $in: ["p7farmer@test.com", "p7buyer@test.com", "p7admin@test.com"] } });
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log("Test server closed and DB disconnected.");
  }
}

runTests();
