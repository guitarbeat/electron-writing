import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE_URL } from "./config";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool });
