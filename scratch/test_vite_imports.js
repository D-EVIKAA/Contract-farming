const http = require('http');

async function testFetch(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, body: data });
      });
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function run() {
  console.log("=== TESTING VITE MODULE RESOLUTION ON LOCALHOST:3000 ===");
  const mainRes = await testFetch('/src/main.jsx');
  console.log("GET /src/main.jsx -> Status:", mainRes.status, "Length:", mainRes.length);
  if (mainRes.status !== 200) {
    console.error("ERROR in main.jsx:", mainRes.body);
    process.exit(1);
  }

  const appRes = await testFetch('/src/App.jsx');
  console.log("GET /src/App.jsx -> Status:", appRes.status, "Length:", appRes.length);
  if (appRes.status !== 200) {
    console.error("ERROR in App.jsx:", appRes.body);
    process.exit(1);
  }

  const routesToTest = [
    '/src/components/layout/AppLayout.jsx',
    '/src/components/layout/Sidebar.jsx',
    '/src/components/layout/TopHeader.jsx',
    '/src/pages/farmer/FarmerDashboard.jsx',
    '/src/pages/buyer/BuyerDashboard.jsx',
    '/src/pages/admin/AdminDashboard.jsx',
    '/src/pages/marketplace/FarmMarketplace.jsx',
    '/src/pages/progress/FarmProgressCenter.jsx',
    '/src/pages/insights/SmartInsights.jsx',
    '/src/pages/disputes/DisputeCenter.jsx',
    '/src/pages/activity/ActivityCenter.jsx',
    '/src/pages/profile/ProfilePage.jsx',
    '/src/pages/auth/Login.jsx',
    '/src/pages/auth/Register.jsx',
    '/src/context/AuthContext.jsx',
    '/src/context/ToastContext.jsx',
  ];

  for (const route of routesToTest) {
    const res = await testFetch(route);
    console.log(`GET ${route} -> Status:`, res.status, res.status === 200 ? "OK" : "FAILED!");
    if (res.status !== 200) {
      console.error(`ERROR loading ${route}:`, res.body.slice(0, 500));
      process.exit(1);
    }
  }

  console.log("\nALL FRONTEND MODULES LOADED AND COMPILED SUCCESSFULLY ON LOCALHOST:3000 WITH STATUS 200 OK!");
}

run();
