import { calculateTrackerStats } from '../src/lib/stats.js';
import { Entry, Settings } from '../src/types.js';
import { createApp } from '../server.js';
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

  // 2. Test /api/passcode/helper (Privacy-Preserving Hint)
  console.log("\n--- Testing /api/passcode/helper ---");
  const app = createApp();
  const res = await request(app).get('/api/passcode/helper');
  
  if (res.status === 200 && res.body.hint !== undefined && res.body.passcode === undefined) {
    console.log(`✅ /api/passcode/helper returned hint safely without exposing passcode: ${res.body.hint}`);
  } else {
    console.error(`❌ /api/passcode/helper FAILED: expected hint, no passcode. Got status ${res.status}, body:`, res.body);
  }

  // 3. Test Authentication Logic and Fallbacks
  console.log("\n--- Testing Authentication Edge Cases ---");

  // Falsy value (0) instead of "0000"
  const loginFailRes = await request(app).post('/api/session').send({ passcode: 0 });
  if (loginFailRes.status === 401) {
    console.log("✅ Correctly rejected numeric 0 instead of passcode string");
  } else {
    console.error("❌ FAILED to reject numeric 0:", loginFailRes.body);
  }

  // Missing passcode
  const loginMissingRes = await request(app).post('/api/session').send({});
  if (loginMissingRes.status === 401) {
    console.log("✅ Correctly rejected missing passcode");
  } else {
    console.error("❌ FAILED to reject missing passcode:", loginMissingRes.body);
  }

  // Proper fallback environment login ("0000")
  const loginRes = await request(app)
    .post('/api/session')
    .send({ passcode: "0000" });
  
  if (loginRes.status === 200) {
    console.log("✅ Successful login using environment fallback '0000'");
  } else {
    console.error("❌ Successful login FAILED:", loginRes.body);
  }

  const cookie = loginRes.header['set-cookie'];

  // Test cookie flags
  const cookieStr = cookie ? cookie[0] : "";
  if (cookieStr.includes("HttpOnly") && cookieStr.includes("SameSite=Lax")) {
    console.log("✅ Cookie has correct HttpOnly and SameSite=Lax flags");
  } else {
    console.error("❌ Cookie flags are incorrect:", cookieStr);
  }

  // 4. Test /api/settings sanitization
  console.log("\n--- Testing /api/settings sanitization ---");

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
