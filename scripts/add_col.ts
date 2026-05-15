import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "is_setup_complete" boolean DEFAULT false NOT NULL');
    console.log("Added column is_setup_complete");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
