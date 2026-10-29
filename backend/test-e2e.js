import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';
import { startServer } from './index.js';

const PORT = 5002;
const API_BASE = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  console.log('🧪 Starting End-to-End System Tests for Mess Management QR System...\n');

  const server = await startServer(PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('\n--- Test 1: Backend Health Check ---');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'Server is healthy and running');

    // 2. Student Login
    console.log('\n--- Test 2: Student Login (CS21B042) ---');
    const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'CS21B042', password: 'password123', role: 'student' })
    });
    const studentLoginData = await studentLoginRes.json();
    assert(studentLoginRes.status === 200 && !!studentLoginData.token, 'Student login succeeded, received JWT');
    const studentToken = studentLoginData.token;

    // 3. Staff Login
    console.log('\n--- Test 3: Staff Login (admin) ---');
    const staffLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'staff123', role: 'staff' })
    });
    const staffLoginData = await staffLoginRes.json();
    assert(staffLoginRes.status === 200 && !!staffLoginData.token, 'Staff login succeeded, received JWT');
    const staffToken = staffLoginData.token;

    // 4. Fetch Meals with Breakfast Time Simulation (08:30 AM)
    console.log('\n--- Test 4: Fetch Meals with Simulated Time (08:30:00) ---');
    const mealsRes = await fetch(`${API_BASE}/meals`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'x-mock-time': '08:30:00'
      }
    });
    const mealsData = await mealsRes.json();
    const breakfast = mealsData.meals.find(m => m.name === 'Breakfast');
    const lunch = mealsData.meals.find(m => m.name === 'Lunch');
    assert(breakfast?.is_active === true, 'Breakfast is active at 08:30 AM');
    assert(lunch?.is_active === false, 'Lunch is inactive at 08:30 AM');

    // 5. Generate QR Code for Active Meal (Breakfast)
    console.log('\n--- Test 5: Generate Rotating QR Token for Breakfast ---');
    const qrRes = await fetch(`${API_BASE}/qr/${breakfast.id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'x-mock-time': '08:30:00'
      }
    });
    const qrData = await qrRes.json();
    assert(qrRes.status === 200 && !!qrData.token, 'Successfully issued 60s dynamic QR token');
    const dynamicQrToken = qrData.token;

    // Verify decoded payload does NOT contain plain credentials
    const decodedPayload = jwt.decode(dynamicQrToken);
    assert(
      decodedPayload.student_id && decodedPayload.meal_id && decodedPayload.date && decodedPayload.nonce,
      'QR token contains { student_id, meal_id, date, nonce }'
    );
    assert(!decodedPayload.roll_no && !decodedPayload.name, 'Plain roll number / name NOT in QR token payload');

    // 6. Student cannot call /api/scan (Role security check)
    console.log('\n--- Test 6: Security Check - Student Cannot Call /api/scan ---');
    const unauthorizedScanRes = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ token: dynamicQrToken })
    });
    assert(unauthorizedScanRes.status === 403, 'Student blocked from scanning endpoint (HTTP 403)');

    // 7. Staff scans valid QR token (Check in order)
    console.log('\n--- Test 7: Staff Scans Valid QR Token ---');
    const scanRes = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
        'x-mock-time': '08:30:00'
      },
      body: JSON.stringify({ token: dynamicQrToken })
    });
    const scanData = await scanRes.json();
    assert(
      scanRes.status === 200 && scanData.status === 'Entry allowed',
      `Scan accepted: Status="${scanData.status}" for student ${scanData.student?.name} (${scanData.meal?.name})`
    );

    // 8. Double Entry Test - Scanning again must return "Already eaten"
    console.log('\n--- Test 8: Double Entry Prevention (Unique Constraint) ---');
    const duplicateScanRes = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
        'x-mock-time': '08:30:00'
      },
      body: JSON.stringify({ token: dynamicQrToken })
    });
    const duplicateData = await duplicateScanRes.json();
    assert(
      duplicateScanRes.status === 409 && duplicateData.status === 'Already eaten',
      `Duplicate blocked: Status="${duplicateData.status}" - "${duplicateData.error}"`
    );

    // 9. Expired QR Token Test
    console.log('\n--- Test 9: Expired QR Code Test (>60s) ---');
    const expiredToken = jwt.sign(
      { student_id: 2, meal_id: breakfast.id, date: new Date().toISOString().split('T')[0], nonce: 'test' },
      JWT_SECRET,
      { expiresIn: -10 } // Expired 10 seconds ago
    );
    const expiredScanRes = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
        'x-mock-time': '08:30:00'
      },
      body: JSON.stringify({ token: expiredToken })
    });
    const expiredData = await expiredScanRes.json();
    assert(
      expiredScanRes.status === 400 && expiredData.status === 'Expired QR',
      `Expired QR rejected: Status="${expiredData.status}"`
    );

    // 10. Wrong Meal Time Test
    console.log('\n--- Test 10: Wrong Meal Time Test (16:00:00 - outside window) ---');
    const wrongTimeToken = jwt.sign(
      { student_id: 2, meal_id: breakfast.id, date: new Date().toISOString().split('T')[0], nonce: 'test-nonce' },
      JWT_SECRET,
      { expiresIn: '60s' }
    );
    const wrongTimeScanRes = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
        'x-mock-time': '16:00:00' // 4:00 PM (Breakfast window is 07:30 - 09:30)
      },
      body: JSON.stringify({ token: wrongTimeToken })
    });
    const wrongTimeData = await wrongTimeScanRes.json();
    assert(
      wrongTimeScanRes.status === 400 && wrongTimeData.status === 'Wrong meal time',
      `Wrong meal time rejected: Status="${wrongTimeData.status}"`
    );

    // 11. Student Attendance History
    console.log('\n--- Test 11: Student Attendance History Verification ---');
    const historyRes = await fetch(`${API_BASE}/student/history`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && Array.isArray(historyData.history), 'History fetched successfully');
    assert(historyData.history.length > 0, `History contains ${historyData.history.length} records`);

    // 12. Staff Recent Scans and Today's Stats
    console.log('\n--- Test 12: Staff Stats & Recent Scans Verification ---');
    const statsRes = await fetch(`${API_BASE}/meals/today-stats`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const statsData = await statsRes.json();
    const breakfastStat = statsData.stats?.find(s => s.meal_name === 'Breakfast' || s.name === 'Breakfast');
    assert(breakfastStat?.total_scans >= 1, `Today's Breakfast count is ${breakfastStat?.total_scans}`);

    console.log('\n===============================================');
    console.log(`🎉 ALL TESTS PASSED: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================\n');
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
