const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const BASE_URL = "http://localhost:5009";

const authRoutes = require("./routes/authRoutes");
const contractRoutes = require("./routes/contractRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const User = require("./models/User");
const Contract = require("./models/Contract");
const Payment = require("./models/Payment");
const Notification = require("./models/Notification");

let server;

async function setupTestServer() {
  const app = express();
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/contracts", contractRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/notifications", notificationRoutes);

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/contract_farming_db");

  return new Promise((resolve) => {
    server = app.listen(5009, () => {
      resolve();
    });
  });
}

async function runTests() {
  console.log("=== STARTING AADHAAR & PAYMENT GATEWAY INTEGRATION TESTS ===");
  await setupTestServer();

  let passed = 0;
  let total = 0;

  function record(desc, cond, extra = "") {
    total++;
    if (cond) {
      passed++;
      console.log(`[PASS] ${total}. ${desc} ${extra ? "- " + extra : ""}`);
    } else {
      console.error(`[FAIL] ${total}. ${desc} ${extra ? "- " + extra : ""}`);
    }
  }

  try {
    const timestamp = Date.now();
    const farmerEmail = `farmer_pay_${timestamp}@test.com`;
    const buyerEmail = `buyer_pay_${timestamp}@test.com`;
    const testAadhaar = "998877665544";

    // 1. Aadhaar Initiation Validation - Missing Consent Check
    const noConsentRes = await fetch(`${BASE_URL}/api/auth/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, consent: false }),
    });
    record("1. Aadhaar OTP Rejection on Missing User Consent", noConsentRes.status === 400);

    // 2. Aadhaar Initiation - Successful Sandbox Session with Consent
    const sendOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, consent: true, consentText: "I agree to verify my Aadhaar" }),
    });
    const sendOtpData = await sendOtpRes.json();
    const clientId = sendOtpData.clientId;
    record("2. Aadhaar OTP Initiation via Sandbox Service", sendOtpRes.status === 200 && !!clientId && sendOtpData.isSandbox === true, `ClientId: ${clientId}`);

    // 3. Aadhaar Verification - Invalid OTP check
    const badOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, clientId, otp: "000000" }),
    });
    record("3. Aadhaar OTP Rejection on Invalid Code", badOtpRes.status === 400);

    // 4. Aadhaar Verification - Valid OTP completion
    const goodOtpRes = await fetch(`${BASE_URL}/api/auth/aadhaar/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar: testAadhaar, clientId, otp: "123456" }),
    });
    const goodOtpData = await goodOtpRes.json();
    record("4. Aadhaar OTP Verification Success", goodOtpRes.status === 200 && goodOtpData.aadhaarVerified === true && goodOtpData.aadhaarLast4 === "5544");

    // 5. Register Farmer with verified Aadhaar
    const farmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Gateway Farmer",
        email: farmerEmail,
        password: "password123",
        role: "farmer",
        phone: "9876543211",
        address: "Green Farm Villa, Punjab",
        farmDetails: { farmSize: "8 Acres", cropsGrown: "Wheat, Mustard" },
        aadhaar: testAadhaar,
      }),
    });
    const farmerRegData = await farmerRegRes.json();
    const farmerToken = farmerRegData.token;
    const farmerId = farmerRegData.user?.id;
    record("5. Farmer Registration with Verified Aadhaar", farmerRegRes.status === 201 && !!farmerToken, `Farmer ID: ${farmerId}`);

    // 6. Data Minimization Check: Confirm full 12-digit Aadhaar is NOT stored in DB
    const dbFarmer = await User.findById(farmerId).select("+password +aadhaarHash");
    const rawDocStr = JSON.stringify(dbFarmer.toObject());
    const fullAadhaarLeaked = rawDocStr.includes(testAadhaar);
    record("6. UIDAI Data Minimization Compliance (Full 12-digit Aadhaar NOT in DB)", !fullAadhaarLeaked && dbFarmer.aadhaarLast4 === "5544" && dbFarmer.aadhaarVerified === true);

    // 7. Register Buyer
    const buyerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AgriCorp Buyer",
        email: buyerEmail,
        password: "password123",
        role: "buyer",
        phone: "9123456782",
        address: "Agri Hub, Delhi",
        businessName: "AgriCorp Food Processing Ltd",
      }),
    });
    const buyerRegData = await buyerRegRes.json();
    const buyerToken = buyerRegData.token;
    const buyerId = buyerRegData.user?.id;
    record("7. Buyer Registration", buyerRegRes.status === 201 && !!buyerToken, `Buyer ID: ${buyerId}`);

    // 8. Create Contract (Buyer proposes to Farmer)
    const contractRes = await fetch(`${BASE_URL}/api/contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        farmerId: farmerId,
        cropName: "Organic Wheat",
        quantity: 200,
        unit: "quintal",
        pricePerUnit: 2500,
        expectedDeliveryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        location: "Green Farm Villa, Punjab",
      }),
    });
    const contractData = await contractRes.json();
    const contractId = contractData.contract?._id;
    const totalAmount = contractData.contract?.totalAmount; // 200 * 2500 = 500,000
    record("8. Buyer Proposes Contract", contractRes.status === 201 && totalAmount === 500000, `Contract ID: ${contractId}, Value: ₹${totalAmount}`);

    // 9. Unauthorized Payment Attempt: Farmer attempts to create payment order (Must fail 403)
    const farmerPayRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({ contractId }),
    });
    record("9. Security Check: Farmer Blocked from Initiating Payment Order", farmerPayRes.status === 403);

    // 10. Buyer Creates Gateway Payment Order
    const createOrderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ contractId }),
    });
    const orderData = await createOrderRes.json();
    const orderId = orderData.orderId;
    record("10. Buyer Creates Payment Gateway Order (Server Amount Calculation)", createOrderRes.status === 201 && !!orderId && orderData.amount === 500000, `Order ID: ${orderId}`);

    // 11. Payment Gateway Configuration Status Check
    const configRes = await fetch(`${BASE_URL}/api/payments/config`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const configData = await configRes.json();
    record("11. Gateway Configuration Info Endpoint", configRes.status === 200 && !!configData.mode);

    // 12. Buyer Completes Payment Verification
    const fakePaymentId = `pay_test_${timestamp}_${Date.now()}`;
    const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        contractId,
        orderId,
        paymentId: fakePaymentId,
        signature: "sandbox_sig_verified",
        paymentMethod: "upi",
        vpa: "buyer@oksbi",
      }),
    });
    const verifyData = await verifyRes.json();
    record("12. Server-Side Payment Verification & State Update", verifyRes.status === 200 && verifyData.contract?.paymentStatus === "Paid");

    // 13. Idempotency Check: Duplicate Payment Verification Rejected/Handled Gracefully
    const dupVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        contractId,
        orderId,
        paymentId: fakePaymentId,
        signature: "sandbox_sig_verified",
      }),
    });
    const dupData = await dupVerifyRes.json();
    record("13. Payment Idempotency (Duplicate Verification Handled)", dupVerifyRes.status === 200 && dupData.alreadyProcessed === true);

    // 14. Contract Payment Status in Database Check
    const updatedContract = await Contract.findById(contractId);
    record("14. Contract DB paymentStatus Updated to 'Paid'", updatedContract.paymentStatus === "Paid");

    // 15. In-App Payment Notifications Delivered to Farmer
    const farmerNotifs = await Notification.find({ user: farmerId });
    const hasPaymentNotif = farmerNotifs.some((n) => n.title.toLowerCase().includes("payment") || n.message.toLowerCase().includes("payment"));
    record("15. Automatic In-App Payment Notification Sent to Farmer", hasPaymentNotif);

    // 16. Payment History Scoping: Buyer History includes this payment
    const buyerHistoryRes = await fetch(`${BASE_URL}/api/payments/history`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const buyerHistoryData = await buyerHistoryRes.json();
    const buyerHasTxn = buyerHistoryData.payments?.some((p) => p.orderId === orderId && p.status === "Successful");
    record("16. Buyer Payment History API Verification", buyerHistoryRes.status === 200 && buyerHasTxn);

    // 17. Payment History Scoping: Farmer History includes received payment
    const farmerHistoryRes = await fetch(`${BASE_URL}/api/payments/history`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerHistoryData = await farmerHistoryRes.json();
    const farmerHasTxn = farmerHistoryData.payments?.some((p) => p.orderId === orderId && p.status === "Successful");
    record("17. Farmer Received Payments History Scoping", farmerHistoryRes.status === 200 && farmerHasTxn);

    // 18. Payment History Cross-User Isolation: Third party buyer cannot see this payment
    const thirdPartyBuyerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Other Buyer",
        email: `other_${timestamp}@test.com`,
        password: "password123",
        role: "buyer",
      }),
    });
    const otherBuyerToken = (await thirdPartyBuyerRes.json()).token;
    const otherHistoryRes = await fetch(`${BASE_URL}/api/payments/history`, {
      headers: { Authorization: `Bearer ${otherBuyerToken}` },
    });
    const otherHistoryData = await otherHistoryRes.json();
    const leaked = otherHistoryData.payments?.some((p) => p.orderId === orderId);
    record("18. Payment History Scoping Isolation (No cross-tenant data leakage)", !leaked);

    // 19. Payment Failure Reporting Endpoint Check
    const failedOrderRes = await fetch(`${BASE_URL}/api/payments/failure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        orderId: `order_fail_${timestamp}`,
        failureReason: "User cancelled at UPI intent app selection",
      }),
    });
    record("19. Payment Failure / Dismissal Handled", failedOrderRes.status === 200);

    // 20. Prevent New Payment Order on Already-Paid Contract
    const payAgainRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ contractId }),
    });
    record("20. Rejection of Payment Order on Already-Paid Contract", payAgainRes.status === 400);

    // Cleanup test data
    await Contract.findByIdAndDelete(contractId);
    await Payment.deleteMany({ contract: contractId });
    await User.deleteMany({ email: { $in: [farmerEmail, buyerEmail, `other_${timestamp}@test.com`] } });
  } catch (err) {
    console.error("Test execution exception:", err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log(`\n=== RESULTS: ${passed} / ${total} TESTS PASSED ===\n`);
  }
}

runTests();
