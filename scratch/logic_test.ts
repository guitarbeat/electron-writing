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

  // 5. Test auth-required routes without session
  console.log("\n--- Testing Auth-Required Routes ---");
  const entriesNoAuth = await request(app).get('/api/entries');
  if (entriesNoAuth.status === 401) {
    console.log("✅ /api/entries correctly requires auth (401)");
  } else {
    console.error(`❌ /api/entries Auth Check FAILED: Expected 401, got ${entriesNoAuth.status}`);
  }

  // 6. Test /api/entries invalid input
  console.log("\n--- Testing /api/entries invalid input ---");
  const badDateRes = await request(app)
    .post('/api/entries')
    .set('Cookie', cookie)
    .send({ date: 'invalid-date', aaronWords: 100, electraWords: 100 });

  if (badDateRes.status === 400 && badDateRes.body.error) {
    console.log("✅ /api/entries caught invalid date format (400)");
  } else {
    console.error(`❌ /api/entries invalid date FAILED: status ${badDateRes.status}`);
  }

  const badNegativeRes = await request(app)
    .post('/api/entries')
    .set('Cookie', cookie)
    .send({ date: todayStr, aaronWords: -50, electraWords: 100 });

  if (badNegativeRes.status === 400 && badNegativeRes.body.error) {
    console.log("✅ /api/entries caught negative word count (400)");
  } else {
    console.error(`❌ /api/entries negative word count FAILED: status ${badNegativeRes.status}`);
  }

  // 7. Test /api/entries atomic upsert
  console.log("\n--- Testing /api/entries atomic upsert ---");
  const upsertDate = '2099-01-01';
  await request(app)
    .post('/api/entries')
    .set('Cookie', cookie)
    .send({ date: upsertDate, aaronWords: 100, electraWords: 0 });

  const upsertRes = await request(app)
    .post('/api/entries')
    .set('Cookie', cookie)
    .send({ date: upsertDate, aaronWords: 200, electraWords: 50, note: "upsert test" });

  if (upsertRes.status === 200 && upsertRes.body.aaronWords === 200 && upsertRes.body.electraWords === 50) {
    console.log("✅ /api/entries atomic upsert successful");
  } else {
    console.error(`❌ /api/entries atomic upsert FAILED:`, upsertRes.body);
  }

  // 8. Test Export / Import behavior
  console.log("\n--- Testing Import/Export ---");
  const exportRes = await request(app)
    .get('/api/export')
    .set('Cookie', cookie);

  if (exportRes.status === 200 && exportRes.body.settings) {
    if (exportRes.body.settings.passcode === undefined) {
      console.log("✅ /api/export successfully stripped passcode from settings");
    } else {
      console.error("❌ /api/export FAILED: passcode leaked in export settings");
    }
  } else {
    console.error(`❌ /api/export FAILED: status ${exportRes.status}`);
  }

  const importRes = await request(app)
    .post('/api/import')
    .set('Cookie', cookie)
    .send({
      mode: 'append',
      entries: [
        { date: 'invalid-date', aaronWords: 100 }, // should skip
        { date: '2099-01-02', aaronWords: -100 }, // should skip
        { date: '2099-01-03', aaronWords: 50, electraWords: 50 } // should import
      ]
    });

  if (importRes.status === 200) {
    const checkImport = await request(app)
      .get('/api/entries')
      .set('Cookie', cookie);

    const foundInvalid = checkImport.body.find((e: any) => e.date === 'invalid-date');
    const foundNegative = checkImport.body.find((e: any) => e.date === '2099-01-02');
    const foundValid = checkImport.body.find((e: any) => e.date === '2099-01-03');

    if (!foundInvalid && !foundNegative && foundValid) {
      console.log("✅ /api/import successfully validated and skipped invalid entries");
    } else {
      console.error("❌ /api/import validation FAILED");
    }
  } else {
    console.error(`❌ /api/import FAILED: status ${importRes.status}`);
  }

  console.log("\n✨ Tests completed.");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
