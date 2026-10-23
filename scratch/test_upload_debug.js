const path = require("path");
module.paths.push(path.join(__dirname, "../backend/node_modules"));
module.paths.push(path.join(__dirname, "../frontend/node_modules"));

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const API_URL = "http://localhost:5000/api";

async function testUploads() {
  try {
    console.log("--- 1. Health check ---");
    const health = await axios.get(`${API_URL}/health`);
    console.log("Health response:", health.data);

    // Register/Login test farmer
    const farmerEmail = `farmer_test_${Date.now()}@example.com`;
    console.log("\n--- 2. Registering Farmer ---");
    const farmerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Farmer Upload",
      email: farmerEmail,
      password: "password123",
      role: "farmer",
      phone: "9876543210",
      address: "Farm Road 1",
    });
    const farmerToken = farmerRes.data.token;
    console.log("Farmer registered successfully. Token received.");

    // Prepare a sample image buffer
    const dummyImagePath = path.join(__dirname, "sample_test.png");
    // Create a 1x1 png pixel
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(dummyImagePath, png1x1);

    // Test Farmer Profile Picture Upload
    console.log("\n--- 3. Uploading Farmer Profile Picture ---");
    const formPic = new FormData();
    formPic.append("image", fs.createReadStream(dummyImagePath));

    const picRes = await axios.put(`${API_URL}/users/me/profile-picture`, formPic, {
      headers: {
        ...formPic.getHeaders(),
        Authorization: `Bearer ${farmerToken}`,
      },
    });
    console.log("Farmer Profile Pic Upload Result:", picRes.data);

    // Test Farmer Farm Photo Upload
    console.log("\n--- 4. Uploading Farmer Farm Photo ---");
    const formFarm = new FormData();
    formFarm.append("photo", fs.createReadStream(dummyImagePath));

    const farmRes = await axios.post(`${API_URL}/users/me/farm-photos`, formFarm, {
      headers: {
        ...formFarm.getHeaders(),
        Authorization: `Bearer ${farmerToken}`,
      },
    });
    console.log("Farmer Farm Photo Upload Result:", farmRes.data);

    // Register/Login test buyer
    const buyerEmail = `buyer_test_${Date.now()}@example.com`;
    console.log("\n--- 5. Registering Buyer ---");
    const buyerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Buyer Upload",
      email: buyerEmail,
      password: "password123",
      role: "buyer",
      phone: "9123456789",
      address: "Buyer Street 2",
      businessName: "Buyer Global",
    });
    const buyerToken = buyerRes.data.token;
    console.log("Buyer registered successfully. Token received.");

    // Test Buyer Profile Picture Upload
    console.log("\n--- 6. Uploading Buyer Profile Picture ---");
    const formBuyerPic = new FormData();
    formBuyerPic.append("image", fs.createReadStream(dummyImagePath));

    const buyerPicRes = await axios.put(`${API_URL}/users/me/profile-picture`, formBuyerPic, {
      headers: {
        ...formBuyerPic.getHeaders(),
        Authorization: `Bearer ${buyerToken}`,
      },
    });
    console.log("Buyer Profile Pic Upload Result:", buyerPicRes.data);

    // Test Buyer Business Photo Upload
    console.log("\n--- 7. Uploading Buyer Business Photo ---");
    const formBiz = new FormData();
    formBiz.append("photo", fs.createReadStream(dummyImagePath));

    const bizRes = await axios.post(`${API_URL}/users/me/business-photos`, formBiz, {
      headers: {
        ...formBiz.getHeaders(),
        Authorization: `Bearer ${buyerToken}`,
      },
    });
    console.log("Buyer Business Photo Upload Result:", bizRes.data);

    // Clean up sample image
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

    console.log("\n--- ALL BACKEND UPLOAD TESTS PASSED! ---");
  } catch (err) {
    console.error("\n❌ UPLOAD TEST FAILED!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testUploads();
