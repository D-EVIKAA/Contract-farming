const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contractRoutes = require("./routes/contractRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const User = require("./models/User");
const Contract = require("./models/Contract");
const Dispute = require("./models/Dispute");
const Notification = require("./models/Notification");

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log("=== STARTING PHASE 9 BACKEND INTEGRATION & REGRESSION TESTS ===");

  await connectDB();
  const app = express();
  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.get("/api/health", (req, res) => res.status(200).json({ status: "OK" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/contracts", contractRoutes);
  app.use("/api/disputes", disputeRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);

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

    // Clean up test users & notifications
    await User.deleteMany({ email: { $in: ["p9farmer@test.com", "p9buyer@test.com", "p9admin@test.com"] } });
    await Notification.deleteMany({});

    // 2. Register Farmer
    const farmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Phase9 Farmer",
        email: "p9farmer@test.com",
        password: "password123",
        role: "farmer",
        phone: "1234567890",
        address: "Green Farm Lane",
        farmDetails: { farmSize: "10 Acres", soilType: "Loam", cropsGrown: "Wheat, Rice", location: "Punjab" },
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
        name: "Phase9 Buyer",
        email: "p9buyer@test.com",
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
      name: "Phase9 Admin",
      email: "p9admin@test.com",
      password: adminHashed,
      role: "admin",
      isActive: true,
    });
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "p9admin@test.com", password: "password123" }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    const adminId = adminUser._id.toString();
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
    record("5. Create Contract without farmerId (Validation Check)", missingFarmerRes.status === 400);

    // 6. Contract Creation Validation: non-farmer ID
    const invalidFarmerRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        farmerId: buyerId,
        cropName: "Organic Wheat",
        quantity: 100,
        pricePerUnit: 50,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        location: "Warehouse A",
      }),
    });
    record("6. Create Contract with non-farmer ID (Validation Check)", invalidFarmerRes.status === 400);

    // 7. Successful Contract Creation -> Selected farmer receives NEW CONTRACT notification
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
      "7. Contract Creation & Farmer Trigger Notification",
      validContractRes.status === 201 && initialStatus === "Pending",
      `Contract ID: ${contractId}`
    );

    // 8. Farmer fetches notifications -> verifies NEW CONTRACT notification received
    const farmerNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerNotifData = await farmerNotifRes.json();
    const hasContractNotif = farmerNotifData.notifications?.some(
      (n) => n.title.toLowerCase().includes("contract") || n.type.toLowerCase().includes("contract")
    );
    record(
      "8. Farmer Notification Check (New Contract Notification Received)",
      farmerNotifRes.status === 200 && farmerNotifData.notifications?.length >= 1 && hasContractNotif,
      `Count: ${farmerNotifData.count}, Unread: ${farmerNotifData.unreadCount}`
    );

    // 9. Notification Security: Buyer fetches notifications -> only gets buyer's notifications, NOT farmer's
    const buyerNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerNotifData = await buyerNotifRes.json();
    const farmerNotifId = farmerNotifData.notifications[0]?._id;
    record(
      "9. Notification Security: GET /api/notifications filters by req.user._id",
      buyerNotifRes.status === 200 && buyerNotifData.notifications?.every((n) => n.user !== farmerId),
      "Farmer notification not exposed to buyer"
    );

    // 10. Role Authorization Check: Buyer tries to accept contract
    const buyerAcceptRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("10. Security Check: Buyer attempts Accept", buyerAcceptRes.status === 403);

    // 11. Farmer Accepts Proposal: Pending -> Accepted
    const acceptRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const acceptData = await acceptRes.json();
    record("11. Farmer Accepts Contract (Pending -> Accepted)", acceptRes.status === 200 && acceptData.contract?.status === "Accepted");

    // 12. Farmer Progress Update: Accepted -> In Progress
    const formData = new FormData();
    formData.append("note", "Sowed seeds successfully");
    const dummyBlob = new Blob(["dummy image content"], { type: "image/png" });
    formData.append("image", dummyBlob, "progress.png");

    const progressRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/progress`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: formData,
    });
    const progressData = await progressRes.json();
    record("12. Farmer Adds Progress (Accepted -> In Progress)", progressRes.status === 200 && progressData.contract?.status === "In Progress");

    // 13. Farmer Marks Ready for Delivery: In Progress -> Ready for Delivery
    const readyRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/ready`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const readyData = await readyRes.json();
    record("13. Farmer Marks Ready (In Progress -> Ready for Delivery)", readyRes.status === 200 && readyData.contract?.status === "Ready for Delivery");

    // 14. Farmer Dispatches Contract: Ready for Delivery -> Dispatched
    const dispatchRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/dispatch`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const dispatchData = await dispatchRes.json();
    record("14. Farmer Dispatches Crop (Ready for Delivery -> Dispatched)", dispatchRes.status === 200 && dispatchData.contract?.status === "Dispatched");

    // 15. Buyer Confirms Delivery: Dispatched -> Delivered
    const confirmDeliveryRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-delivery`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const confirmDeliveryData = await confirmDeliveryRes.json();
    record("15. Buyer Confirms Delivery (Dispatched -> Delivered)", confirmDeliveryRes.status === 200 && confirmDeliveryData.contract?.status === "Delivered");

    // 16. Buyer Completes Contract: Delivered -> Completed
    const completeRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/complete`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const completeData = await completeRes.json();
    record("16. Buyer Completes Contract (Delivered -> Completed)", completeRes.status === 200 && completeData.contract?.status === "Completed");

    // 17. Buyer Initiates Payment: Pending -> Initiated
    const initiatePayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/initiate-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const initiatePayData = await initiatePayRes.json();
    record("17. Buyer Initiates Payment (Pending -> Initiated)", initiatePayRes.status === 200 && initiatePayData.contract?.paymentStatus === "Initiated");

    // 18. Security Check: Buyer attempts Confirm Payment
    const buyerConfirmPayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("18. Security Check: Buyer attempts Confirm Payment", buyerConfirmPayRes.status === 403);

    // 19. Farmer Confirms Payment Receipt: Initiated -> Paid
    const confirmPayRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/confirm-payment`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const confirmPayData = await confirmPayRes.json();
    record("19. Farmer Confirms Payment Receipt (Initiated -> Paid)", confirmPayRes.status === 200 && confirmPayData.contract?.paymentStatus === "Paid");

    // 20. Notification Ownership Security: Buyer attempts mark-read on Farmer's notification
    const crossMarkReadRes = await fetch(`${BASE_URL}/api/notifications/${farmerNotifId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("20. Security Check: Cross-user Mark Read forbidden", crossMarkReadRes.status === 403);

    // 21. Notification Ownership Security: Buyer attempts delete on Farmer's notification
    const crossDeleteRes = await fetch(`${BASE_URL}/api/notifications/${farmerNotifId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("21. Security Check: Cross-user Delete Notification forbidden", crossDeleteRes.status === 403);

    // 22. Contract Timeline Check: statusHistory contains full audit trail
    const singleContractRes = await fetch(`${BASE_URL}/api/contracts/${contractId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const singleContractData = await singleContractRes.json();
    const history = singleContractData.contract?.statusHistory || [];
    record(
      "22. Contract Timeline Verification (statusHistory Audit Trail)",
      singleContractRes.status === 200 && history.length >= 7,
      `Recorded ${history.length} status transitions: ${history.map((h) => h.status).join(" -> ")}`
    );

    // 23. Farmer Search / Filter API Check
    const farmerSearchRes = await fetch(`${BASE_URL}/api/users/farmers?crop=Wheat&location=Punjab`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const farmerSearchData = await farmerSearchRes.json();
    record(
      "23. Farmer Search/Filter API (GET /api/users/farmers?crop=Wheat&location=Punjab)",
      farmerSearchRes.status === 200 && farmerSearchData.farmers?.some((f) => f._id === farmerId)
    );

    // 24. Contract Search / Filter API Check
    const contractSearchRes = await fetch(`${BASE_URL}/api/contracts?status=Completed&crop=Organic`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const contractSearchData = await contractSearchRes.json();
    record(
      "24. Contract Search/Filter API (GET /api/contracts?status=Completed&crop=Organic)",
      contractSearchRes.status === 200 && contractSearchData.contracts?.some((c) => c._id === contractId)
    );

    // 25. Profile Picture Upload
    const profileForm = new FormData();
    profileForm.append("image", new Blob(["profile pic"], { type: "image/jpeg" }), "profile.jpg");
    const profileUploadRes = await fetch(`${BASE_URL}/api/users/me/profile-picture`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: profileForm,
    });
    record("25. Profile Picture Upload", profileUploadRes.status === 200);

    // 26. Dispute System: Create Dispute
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
    record("26. Create Dispute & Trigger Notifications", disputeCreateRes.status === 201 && disputeCreateData.dispute?.status === "Open");

    // 27. Security Check: User attempts Dispute Resolution
    const userDisputeUpdateRes = await fetch(`${BASE_URL}/api/disputes/${disputeId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ status: "Resolved", resolutionDetails: "Self resolved" }),
    });
    record("27. Security Check: Normal user attempts Dispute Resolution", userDisputeUpdateRes.status === 403);

    // 28. Dispute System: Admin Updates Status
    const adminDisputeUpdateRes = await fetch(`${BASE_URL}/api/disputes/${disputeId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "Resolved", resolutionDetails: "Resolved after review by Admin" }),
    });
    const adminDisputeUpdateData = await adminDisputeUpdateRes.json();
    record("28. Admin Dispute Status Update & Trigger Notification", adminDisputeUpdateRes.status === 200 && adminDisputeUpdateData.dispute?.status === "Resolved");

    // 29. Admin Analytics Endpoint Check
    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData = await adminStatsRes.json();
    record(
      "29. Admin Analytics API (GET /api/admin/stats)",
      adminStatsRes.status === 200 && adminStatsData.contracts?.total >= 1 && adminStatsData.financials?.totalAgreedValue > 0,
      `Users: ${adminStatsData.users?.total}, Contracts: ${adminStatsData.contracts?.total}, Financial Value: \$${adminStatsData.financials?.totalAgreedValue}`
    );

    // 30. Admin Analytics Security Check: Buyer / Farmer cannot access admin stats
    const buyerStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    record("30. Security Check: Buyer access to Admin Stats forbidden", buyerStatsRes.status === 403);

    console.log("\n=== TEST RESULTS SUMMARY ===");
    const passedCount = testResults.filter((t) => t.success).length;
    console.log(`TOTAL PASSED: ${passedCount} / ${testResults.length}`);

    // Cleanup
    if (contractId) await Contract.findByIdAndDelete(contractId);
    if (disputeId) await Dispute.findByIdAndDelete(disputeId);
    await User.deleteMany({ email: { $in: ["p9farmer@test.com", "p9buyer@test.com", "p9admin@test.com"] } });
    await Notification.deleteMany({});
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log("Test server closed and DB disconnected.");
  }
}

runTests();
