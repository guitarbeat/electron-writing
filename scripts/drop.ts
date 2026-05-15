import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await pool.query('DROP TABLE IF EXISTS "entries" CASCADE');
  await pool.query('DROP TABLE IF EXISTS "settings" CASCADE');
  await pool.query('DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE');

  await pool.query(`
    CREATE TABLE "entries" (
      "id" text PRIMARY KEY NOT NULL,
      "date" text NOT NULL,
      "aaron_words" integer DEFAULT 0 NOT NULL,
      "electra_words" integer DEFAULT 0 NOT NULL,
      "note" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE "settings" (
      "id" text PRIMARY KEY NOT NULL,
      "person_a_name" text DEFAULT 'Aaron' NOT NULL,
      "person_b_name" text DEFAULT 'Electra' NOT NULL,
      "person_a_color" text DEFAULT '#ff4d8d' NOT NULL,
      "person_b_color" text DEFAULT '#7c3aed' NOT NULL,
      "team_color" text DEFAULT '#2b1720' NOT NULL,
      "goals_enabled" boolean DEFAULT true NOT NULL,
      "individual_goals_enabled" boolean DEFAULT false NOT NULL,
      "team_weekly_goal" integer DEFAULT 7000 NOT NULL,
      "person_a_weekly_goal" integer DEFAULT 3500 NOT NULL,
      "person_b_weekly_goal" integer DEFAULT 3500 NOT NULL,
      "activity_thresholds" jsonb DEFAULT '[250, 750, 1500]'::jsonb NOT NULL,
      "default_chart_view" text DEFAULT 'daily' NOT NULL,
      "default_grid_view" text DEFAULT 'team' NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  console.log("Created tables manually.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
