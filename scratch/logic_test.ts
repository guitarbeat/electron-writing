import { calculateTrackerStats } from '../src/lib/stats';
import { Entry, Settings } from '../src/types';
import { createApp } from '../server';
import request from 'supertest';
import { format } from 'date-fns';

async function runTests() {
  console.log("🚀 Starting Focused Logic Tests...");

  // 1. Test calculateTrackerStats (Today stats)
  console.log("\n--- Testing calculateTrackerStats ---");
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  
  const mockEntries: Entry[] = [
    { id: todayStr, date: todayStr, aaronWords: 500, electraWords: 300, createdAt: now, updatedAt: now },
    { id: '2000-01-01', date: '2000-01-01', aaronWords: 1000, electraWords: 0, createdAt: now, updatedAt: now }
  ];
  
  const stats = calculateTrackerStats(mockEntries, null);
  
  if (stats.todayTeam === 800) {
    console.log("✅ stats.todayTeam correct (800)");
  } else {
    console.error(`❌ stats.todayTeam FAILED: expected 800, got ${stats.todayTeam}`);
  }

  if (stats.totalTeam === 1800) {
    console.log("✅ stats.totalTeam correct (1800)");
  } else {
    console.error(`❌ stats.totalTeam FAILED: expected 1800, got ${stats.totalTeam}`);
  }

  // 2. Test /api/passcode/helper
  console.log("\n--- Testing /api/passcode/helper ---");
  const app = createApp();
  const res = await request(app).get('/api/passcode/helper');
  
  if (res.status === 200 && res.body.passcode !== undefined) {
    console.log(`✅ /api/passcode/helper returned passcode: ${res.body.passcode.replace(/./g, '*')}`);
  } else {
    console.error(`❌ /api/passcode/helper FAILED: status ${res.status}, body:`, res.body);
  }

  // 3. Test /api/settings sanitization
  console.log("\n--- Testing /api/settings sanitization ---");
  const loginRes = await request(app)
    .post('/api/session')
    .send({ passcode: res.body.passcode });
  
  const cookie = loginRes.header['set-cookie'];

  const patchRes = await request(app)
    .patch('/api/settings')
    .set('Cookie', cookie)
    .send({ 
      personAName: 'Updated Aaron',
      forbiddenField: 'This should be ignored',
      lastModifiedBy: 'Test Runner'
    });

  if (patchRes.status === 200) {
    if (patchRes.body.personAName === 'Updated Aaron' && patchRes.body.forbiddenField === undefined) {
      console.log("✅ /api/settings sanitized correctly (allowed field updated, forbidden ignored)");
    } else {
      console.error("❌ /api/settings sanitization FAILED:", patchRes.body);
    }
  } else {
    console.error(`❌ /api/settings PATCH failed with status ${patchRes.status}`);
  }

  // 4. Test /api/session/check
  console.log("\n--- Testing /api/session/check ---");
  const checkAuth = await request(app)
    .get('/api/session/check')
    .set('Cookie', cookie);
  
  if (checkAuth.body.authorized === true) {
    console.log("✅ /api/session/check correctly identifies authorized user");
  } else {
    console.error("❌ /api/session/check FAILED for authorized user:", checkAuth.body);
  }

  const checkUnauth = await request(app).get('/api/session/check');
  if (checkUnauth.body.authorized === false) {
    console.log("✅ /api/session/check correctly identifies unauthorized user");
  } else {
    console.error("❌ /api/session/check FAILED for unauthorized user:", checkUnauth.body);
  }

  console.log("\n✨ Tests completed.");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
