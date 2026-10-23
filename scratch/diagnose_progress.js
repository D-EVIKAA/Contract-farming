const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const connectDB = require("../backend/config/db");
const authRoutes = require("../backend/routes/authRoutes");
const contractRoutes = require("../backend/routes/contractRoutes");

const User = require("../backend/models/User");
const Contract = require("../backend/models/Contract");

const TEST_PORT = 5009;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function diagnose() {
  console.log("=== DIAGNOSING CROP PROGRESS UPDATES DATA FLOW ===");

  await connectDB();
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/contracts", contractRoutes);

  const server = app.listen(TEST_PORT);

  try {
    await User.deleteMany({ email: { $in: ["diag_farmer@test.com", "diag_buyer@test.com"] } });
    await Contract.deleteMany({ cropName: "Diag Tomato" });

    // Register Farmer
    const farmerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Diag Farmer",
        email: "diag_farmer@test.com",
        password: "password123",
        role: "farmer",
      }),
    });
    const farmerData = await farmerRes.json();
    const farmerToken = farmerData.token;
    const farmerId = farmerData.user.id;

    // Register Buyer
    const buyerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Diag Buyer",
        email: "diag_buyer@test.com",
        password: "password123",
        role: "buyer",
      }),
    });
    const buyerData = await buyerRes.json();
    const buyerToken = buyerData.token;

    // Buyer creates contract
    const contractRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        farmerId: farmerId,
        cropName: "Diag Tomato",
        quantity: 100,
        pricePerUnit: 10,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        location: "Farm A",
      }),
    });
    const contractData = await contractRes.json();
    const contractId = contractData.contract._id;

    // Farmer accepts
    await fetch(`${BASE_URL}/api/contracts/${contractId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
    });

    // Farmer adds progress update
    const formData = new FormData();
    formData.append("note", "Tomato crop is growing well and irrigation completed.");
    formData.append("image", new Blob(["fake img"], { type: "image/png" }), "tomato.png");

    const addProgRes = await fetch(`${BASE_URL}/api/contracts/${contractId}/progress`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: formData,
    });
    const addProgData = await addProgRes.json();
    console.log("Response from addProgress:", JSON.stringify(addProgData, null, 2));

    // Farmer fetches contracts list
    const farmerGetRes = await fetch(`${BASE_URL}/api/contracts`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerGetData = await farmerGetRes.json();
    console.log("Farmer GET /api/contracts progressUpdates:", farmerGetData.contracts[0].progressUpdates);

    // Buyer fetches contracts list
    const buyerGetRes = await fetch(`${BASE_URL}/api/contracts`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerGetData = await buyerGetRes.json();
    console.log("Buyer GET /api/contracts progressUpdates:", buyerGetData.contracts[0].progressUpdates);

    // Buyer fetches single contract
    const buyerGetSingleRes = await fetch(`${BASE_URL}/api/contracts/${contractId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerGetSingleData = await buyerGetSingleRes.json();
    console.log("Buyer GET /api/contracts/:id progressUpdates:", buyerGetSingleData.contract.progressUpdates);

    // Cleanup
    await Contract.deleteMany({ cropName: "Diag Tomato" });
    await User.deleteMany({ email: { $in: ["diag_farmer@test.com", "diag_buyer@test.com"] } });
  } catch (err) {
    console.error("Diagnosis error:", err);
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

diagnose();
