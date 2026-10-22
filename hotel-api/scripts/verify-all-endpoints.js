import { createApp } from '../dist/app.js';
import { dbManager } from '../dist/database/connection.js';

interface_test: {
  // Pure Node ESM script
}

const results = [];

async function testEndpoint(baseUrl, method, path, expectedStatus, body) {
  const t0 = performance.now();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t1 = performance.now();
  const data = await res.json().catch(() => ({}));
  const passed = res.status === expectedStatus;

  results.push({
    endpoint: path,
    method,
    status: res.status,
    expectedStatus,
    passed,
    durationMs: Math.round(t1 - t0),
    details: passed ? 'OK' : JSON.stringify(data),
  });

  return data;
}

async function run() {
  console.log('🚀 Starting Comprehensive Grand Azur Full-Stack API & Database Verification...\n');

  // 1. Connect DB
  await dbManager.connect();
  const isHealthy = await dbManager.ping();
  console.log(`📦 MongoDB Connection: ${isHealthy ? '✅ Connected' : '❌ Failed'}`);

  // 2. Start temporary in-process test server on port 3099
  const app = createApp();
  const port = 3099;
  const server = await new Promise((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🌐 Test API Server listening at ${baseUrl}\n`);

  try {
    // 1. Health
    console.log('Testing GET /api/health...');
    const health = await testEndpoint(baseUrl, 'GET', '/api/health', 200);
    console.log(`   Status: ${health.status}, DB Connected: ${health.database?.connected}`);

    // 2. Dashboard
    console.log('Testing GET /api/dashboard...');
    const dash = await testEndpoint(baseUrl, 'GET', '/api/dashboard', 200);
    console.log(`   Period: ${dash.period}, Total Revenue: €${Math.round(dash.rev || 0).toLocaleString()}, RevPAR: €${dash.revpar}`);

    // 3. Dashboard with custom asOf
    console.log('Testing GET /api/dashboard?asOf=2026-08-31...');
    await testEndpoint(baseUrl, 'GET', '/api/dashboard?asOf=2026-08-31', 200);

    // 4. Reservations listing
    console.log('Testing GET /api/reservations (pagination & filtering)...');
    const resList = await testEndpoint(baseUrl, 'GET', '/api/reservations?page=1&limit=5&status=All', 200);
    console.log(`   Total reservations in database: ${resList.total}, Page items: ${resList.items?.length}`);

    // 5. Reservation by ID
    const sampleId = resList.items?.[0]?._id || 1;
    console.log(`Testing GET /api/reservations/${sampleId}...`);
    const resDetail = await testEndpoint(baseUrl, 'GET', `/api/reservations/${sampleId}`, 200);
    console.log(`   Guest: ${resDetail.guestName}, Code: ${resDetail.confirmationCode}, Status: ${resDetail.status}`);

    // 6. Update reservation status
    console.log(`Testing PATCH /api/reservations/${sampleId}/status...`);
    const updateRes = await testEndpoint(baseUrl, 'PATCH', `/api/reservations/${sampleId}/status`, 200, {
      status: 'Confirmed',
    });
    console.log(`   Update success: ${updateRes.success}, New Status: ${updateRes.reservation?.status}`);

    // 7. Create new reservation (triggers room charge + daily_kpi + monthly_kpi updates in MongoDB)
    console.log('Testing POST /api/reservations (with live KPI & Folio updates)...');
    const createRes = await testEndpoint(baseUrl, 'POST', '/api/reservations', 201, {
      guestName: 'Verification Suite Guest',
      guestNationality: 'France',
      room: { number: '401', type: 'Junior Suite' },
      channel: { name: 'Direct Website', type: 'Direct' },
      checkIn: '2026-10-25',
      checkOut: '2026-10-28',
      nights: 3,
      ratePerNight: 380,
      status: 'Confirmed',
    });
    console.log(`   Created ID: ${createRes.reservation?._id}, Code: ${createRes.reservation?.confirmationCode}`);

    // 7b. Add Folio Charge to Reservation (updates charges, folio_charges, and department_revenue_monthly)
    const newResId = createRes.reservation?._id || sampleId;
    console.log(`Testing POST /api/reservations/${newResId}/charges (posting real-time folio charge)...`);
    const chargeRes = await testEndpoint(baseUrl, 'POST', `/api/reservations/${newResId}/charges`, 201, {
      department: 'Food & Beverage',
      amount: 95.50,
      description: 'L\'Azur Fine Dining Dinner',
      date: '2026-10-25',
    });
    console.log(`   Charge posted: €${chargeRes.charge?.amount} to ${chargeRes.charge?.department}, Total Folio: €${chargeRes.reservation?.totalCharges}`);

    // 8. Direct Department Revenue Posting (updates department_revenue_monthly and folio_charges)
    console.log('Testing POST /api/revenue (direct department revenue posting)...');
    const revPost = await testEndpoint(baseUrl, 'POST', '/api/revenue', 201, {
      department: 'Spa & Wellness',
      amount: 250.00,
      description: 'VIP Couple Thalasso Therapy Package',
      date: '2026-10-17',
    });
    console.log(`   Direct Revenue Posted: €${revPost.amount} to ${revPost.department} for period ${revPost.yearMonth}`);

    // 9. Guests listing
    console.log('Testing GET /api/guests...');
    const guestList = await testEndpoint(baseUrl, 'GET', '/api/guests?page=1&limit=5', 200);
    console.log(`   Total guests in database: ${guestList.total}, Sample: ${guestList.items?.[0]?.name} (${guestList.items?.[0]?.vipLevel})`);

    // 10. Guest by ID
    const sampleGuestId = guestList.items?.[0]?.id || 1;
    console.log(`Testing GET /api/guests/${sampleGuestId}...`);
    const guestDetail = await testEndpoint(baseUrl, 'GET', `/api/guests/${sampleGuestId}`, 200);
    console.log(`   Guest profile: ${guestDetail.guest?.first_name} ${guestDetail.guest?.last_name}, Total Stays: ${guestDetail.totalStays}, Spend: €${guestDetail.totalSpend}`);

    // 11. Channels analytics
    console.log('Testing GET /api/channels...');
    const channels = await testEndpoint(baseUrl, 'GET', '/api/channels', 200);
    console.log(`   Distribution channels found: ${channels.channels?.length}`);

    // 12. Full Analytics
    console.log('Testing GET /api/analytics...');
    const analytics = await testEndpoint(baseUrl, 'GET', '/api/analytics', 200);
    console.log(`   Monthly KPIs count: ${analytics.monthlyKpis?.length}, Dept Monthly records: ${analytics.departmentMonthly?.length}`);

    // 13. Settings
    console.log('Testing GET /api/settings...');
    const settings = await testEndpoint(baseUrl, 'GET', '/api/settings', 200);
    console.log(`   Hotel: ${settings.hotel?.hotel_name}, Total Rooms: ${settings.stats?.totalRooms}, Rooms in DB: ${settings.roomTypes?.length}`);

    // 13. Database Tables Metadata
    console.log('Testing GET /api/tables...');
    const tables = await testEndpoint(baseUrl, 'GET', '/api/tables', 200);
    console.log(`   Collections reported: ${tables.tables?.map((t) => `${t.name} (${t.count})`).join(', ')}`);

    // 14. Database Table Data
    console.log('Testing GET /api/tables/rooms...');
    const roomsTable = await testEndpoint(baseUrl, 'GET', '/api/tables/rooms?limit=5', 200);
    console.log(`   Rooms rows returned: ${roomsTable.items?.length} of ${roomsTable.total}`);

    // 15. Chat endpoint (GET info)
    console.log('Testing GET /api/chat...');
    await testEndpoint(baseUrl, 'GET', '/api/chat', 200);

    // 16. Chat endpoint (POST query)
    console.log('Testing POST /api/chat...');
    const chatAns = await testEndpoint(baseUrl, 'POST', '/api/chat', 200, {
      messages: [{ role: 'user', content: 'What is the RevPAR for this year?' }],
    });
    console.log(`   AI Assistant Answer received (${chatAns.answer?.length} chars)`);

  } finally {
    await new Promise((resolve) => server.close(() => resolve()));
    await dbManager.close();
  }

  // Summary Report
  console.log('\n==================================================');
  console.log('           API VERIFICATION RESULTS               ');
  console.log('==================================================');
  let allPass = true;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    if (!r.passed) allPass = false;
    console.log(`${icon} [${r.method}] ${r.endpoint.padEnd(42)} -> ${r.status} (${r.durationMs}ms)`);
  }
  console.log('==================================================');
  if (allPass) {
    console.log(`🎉 ALL ${results.length} ENDPOINTS PASSED SUCCESSFULLY WITH LIVE DATABASE!`);
  } else {
    console.error('❌ SOME ENDPOINTS FAILED.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
