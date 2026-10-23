const http = require('http');

async function testUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, body: data, headers: res.headers });
      });
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function check() {
  console.log("=== CHECKING FRONTEND (http://localhost:3000) ===");
  const fe = await testUrl('http://localhost:3000/');
  console.log("Frontend Status:", fe.status);
  console.log("Frontend Content Length:", fe.length);
  console.log("Frontend Body Snippet:", fe.body ? fe.body.slice(0, 300) : fe.error);

  console.log("\n=== CHECKING BACKEND HEALTH (http://localhost:5000/api/health) ===");
  const be = await testUrl('http://localhost:5000/api/health');
  console.log("Backend Status:", be.status);
  console.log("Backend Response:", be.body ? be.body : be.error);

  console.log("\n=== CHECKING FRONTEND MAIN.JSX (http://localhost:3000/src/main.jsx) ===");
  const mainJs = await testUrl('http://localhost:3000/src/main.jsx');
  console.log("Main.jsx Status:", mainJs.status);
  console.log("Main.jsx Length:", mainJs.length);
  if (mainJs.status !== 200) {
    console.log("Main.jsx Error:", mainJs.body);
  }
}

check();
