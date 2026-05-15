import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE "settings" DROP COLUMN IF EXISTS "team_weekly_goal"');
    console.log("Dropped column team_weekly_goal");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
