import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DATABASE_URL, DATABASE_POOL_MAX } from "./config";
import * as schema from "./schema";

const { Pool } = pg;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: DATABASE_POOL_MAX,
});

export const db = drizzle(pool, { schema });
