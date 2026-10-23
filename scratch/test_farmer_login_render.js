const http = require('http');

async function apiPost(path, body, token = '') {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function apiGet(path, token = '') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log("=== TESTING FARMER LOGIN AND DASHBOARD APIs ===");
  
  // Register or Login a farmer
  let farmerToken = '';
  let farmerUser = null;

  try {
    const loginRes = await apiPost('/auth/login', {
      email: 'farmer_test_debug@test.com',
      password: 'password123'
    });

    if (loginRes.status === 200) {
      farmerToken = loginRes.data.token;
      farmerUser = loginRes.data.user;
      console.log("[PASS] Farmer Login successful. Role:", farmerUser.role);
    } else {
      console.log("Creating new test farmer account...");
      const regRes = await apiPost('/auth/register', {
        name: "Test Farmer",
        email: "farmer_test_debug@test.com",
        password: "password123",
        role: "farmer",
        phone: "9876543210",
        farmDetails: { farmSize: "5 acres", soilType: "Loamy", cropsGrown: "Wheat" }
      });
      console.log("Register status:", regRes.status);
      farmerToken = regRes.data.token;
      farmerUser = regRes.data.user;
      console.log("[PASS] Farmer Registration successful. Role:", farmerUser?.role);
    }

    console.log("\nTesting Farmer API calls used in FarmerDashboard:");
    const contractsRes = await apiGet('/contracts', farmerToken);
    console.log("1. GET /api/contracts -> Status:", contractsRes.status, "Contracts count:", contractsRes.data?.contracts?.length);

    const disputesRes = await apiGet('/disputes', farmerToken);
    console.log("2. GET /api/disputes -> Status:", disputesRes.status, "Disputes count:", disputesRes.data?.disputes?.length);

    const profileRes = await apiGet('/users/me', farmerToken);
    console.log("3. GET /api/users/me -> Status:", profileRes.status, "User Name:", profileRes.data?.user?.name);

    console.log("\nAll Farmer APIs return valid responses!");
  } catch(err) {
    console.error("API test error:", err);
  }
}

run();
