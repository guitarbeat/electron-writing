import request from "supertest";

// Simulate missing connection string
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
process.env.PASSCODE = "test-passcode";

// We require the app AFTER unsetting the env vars so that db/config.ts runs in the faulty state.
// Since modules might have been cached by previous tests or imports in the process,
// we'll run this logic as a standalone script using tsx.
import { createApp } from "../server";

async function run() {
  console.log("Starting DB durability tests...");
  const app = createApp();

  // 1. Test diagnostics endpoint (should return 500 without crashing the server)
  console.log("Testing /api/diagnostics fallback...");
  const diagRes = await request(app).get("/api/diagnostics");
  if (diagRes.status !== 500) {
    throw new Error(`Expected /api/diagnostics to return 500, got ${diagRes.status}`);
  }
  if (!diagRes.body || diagRes.body.status !== "error") {
     throw new Error(`Expected diagnostic error format, got ${JSON.stringify(diagRes.body)}`);
  }

  // 2. Test passcode helper endpoint (should fallback to APP_PASSCODE)
  console.log("Testing /api/passcode/helper fallback...");
  const passRes = await request(app).get("/api/passcode/helper");
  if (passRes.status !== 200) {
    throw new Error(`Expected /api/passcode/helper to return 200, got ${passRes.status}`);
  }
  if (passRes.body.passcode !== "test-passcode") {
    throw new Error(`Expected passcode helper to fallback to 'test-passcode', got ${passRes.body.passcode}`);
  }

  // 3. Test session creation with fallback passcode
  console.log("Testing /api/session fallback...");
  const sessionRes = await request(app).post("/api/session").send({ passcode: "test-passcode" });
  if (sessionRes.status !== 200) {
    throw new Error(`Expected /api/session to succeed with fallback passcode, got ${sessionRes.status}`);
  }

  console.log("DB Durability tests passed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
