const path = require("path");
module.paths.push(path.join(__dirname, "../backend/node_modules"));
module.paths.push(path.join(__dirname, "../frontend/node_modules"));

const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const API_URL = "http://localhost:5000/api";

async function testLargeUploads() {
  try {
    console.log("--- 1. Health check ---");
    const health = await axios.get(`${API_URL}/health`);
    console.log("Health response:", health.data);

    // Create a 7MB image buffer (7 * 1024 * 1024 bytes) to verify > 5MB uploads work now
    console.log("\n--- Creating 7MB test image buffer ---");
    const dummyLargeImagePath = path.join(__dirname, "large_sample_7mb.png");
    
    // Create a PNG header + 7MB padding
    const pngHeader = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const padding = Buffer.alloc(7 * 1024 * 1024 - pngHeader.length);
    const largeBuffer = Buffer.concat([pngHeader, padding]);
    fs.writeFileSync(dummyLargeImagePath, largeBuffer);
    console.log(`7MB image created on disk (${(largeBuffer.length / (1024 * 1024)).toFixed(2)} MB).`);

    // Register/Login test farmer
    const farmerEmail = `farmer_large_${Date.now()}@example.com`;
    console.log("\n--- 2. Registering Farmer ---");
    const farmerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Farmer Large Upload",
      email: farmerEmail,
      password: "password123",
      role: "farmer",
      phone: "9876543210",
      address: "Farm Road 1",
    });
    const farmerToken = farmerRes.data.token;
    console.log("Farmer registered successfully.");

    // Test Farmer Profile Picture Upload with 7MB Image
    console.log("\n--- 3. Uploading Farmer 7MB Profile Picture ---");
    const formPic = new FormData();
    formPic.append("image", fs.createReadStream(dummyLargeImagePath));

    const picRes = await axios.put(`${API_URL}/users/me/profile-picture`, formPic, {
      headers: {
        ...formPic.getHeaders(),
        Authorization: `Bearer ${farmerToken}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    console.log("Farmer 7MB Profile Pic Upload Result:", picRes.data.message, picRes.data.user.profileImage);

    // Test Farmer Farm Photo Upload with 7MB Image
    console.log("\n--- 4. Uploading Farmer 7MB Farm Photo ---");
    const formFarm = new FormData();
    formFarm.append("photo", fs.createReadStream(dummyLargeImagePath));

    const farmRes = await axios.post(`${API_URL}/users/me/farm-photos`, formFarm, {
      headers: {
        ...formFarm.getHeaders(),
        Authorization: `Bearer ${farmerToken}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    console.log("Farmer 7MB Farm Photo Upload Result:", farmRes.data.message, farmRes.data.user.farmDetails.farmPhotos);

    // Register/Login test buyer
    const buyerEmail = `buyer_large_${Date.now()}@example.com`;
    console.log("\n--- 5. Registering Buyer ---");
    const buyerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Buyer Large Upload",
      email: buyerEmail,
      password: "password123",
      role: "buyer",
      phone: "9123456789",
      address: "Buyer Street 2",
      businessName: "Buyer Global Large",
    });
    const buyerToken = buyerRes.data.token;
    console.log("Buyer registered successfully.");

    // Test Buyer Profile Picture Upload with 7MB Image
    console.log("\n--- 6. Uploading Buyer 7MB Profile Picture ---");
    const formBuyerPic = new FormData();
    formBuyerPic.append("image", fs.createReadStream(dummyLargeImagePath));

    const buyerPicRes = await axios.put(`${API_URL}/users/me/profile-picture`, formBuyerPic, {
      headers: {
        ...formBuyerPic.getHeaders(),
        Authorization: `Bearer ${buyerToken}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    console.log("Buyer 7MB Profile Pic Upload Result:", buyerPicRes.data.message, buyerPicRes.data.user.profileImage);

    // Test Buyer Business Photo Upload with 7MB Image
    console.log("\n--- 7. Uploading Buyer 7MB Business Photo ---");
    const formBiz = new FormData();
    formBiz.append("photo", fs.createReadStream(dummyLargeImagePath));

    const bizRes = await axios.post(`${API_URL}/users/me/business-photos`, formBiz, {
      headers: {
        ...formBiz.getHeaders(),
        Authorization: `Bearer ${buyerToken}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    console.log("Buyer 7MB Business Photo Upload Result:", bizRes.data.message, bizRes.data.user.businessPhotos);

    // Test 11MB file to verify safety limit rejection (>10MB)
    console.log("\n--- 8. Testing safety limit rejection for >10MB file ---");
    const dummyOverLimitPath = path.join(__dirname, "overlimit_11mb.png");
    const padding11MB = Buffer.alloc(11 * 1024 * 1024 - pngHeader.length);
    fs.writeFileSync(dummyOverLimitPath, Buffer.concat([pngHeader, padding11MB]));

    const formOver = new FormData();
    formOver.append("image", fs.createReadStream(dummyOverLimitPath));

    try {
      await axios.put(`${API_URL}/users/me/profile-picture`, formOver, {
        headers: {
          ...formOver.getHeaders(),
          Authorization: `Bearer ${buyerToken}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      console.error("❌ ERROR: Over 10MB file was unexpectedly accepted!");
    } catch (overErr) {
      console.log("✅ Over-limit 11MB file rejected properly as expected:", overErr.response?.data?.message || overErr.message);
    }

    // Clean up sample images
    if (fs.existsSync(dummyLargeImagePath)) fs.unlinkSync(dummyLargeImagePath);
    if (fs.existsSync(dummyOverLimitPath)) fs.unlinkSync(dummyOverLimitPath);

    console.log("\n--- ALL 10MB FILE SIZE LIMIT TESTS PASSED SUCCESSFULLY! ---");
  } catch (err) {
    console.error("\n❌ LARGE UPLOAD TEST FAILED!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testLargeUploads();
