import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "metric" text DEFAULT \'words\' NOT NULL');
    await pool.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "project_goal" integer DEFAULT 50000 NOT NULL');
    await pool.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deadline" text DEFAULT \'2026-12-31\' NOT NULL');
    console.log("Added new columns to settings");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
