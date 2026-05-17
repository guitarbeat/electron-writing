import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export const db = drizzle({ client: getPool() });
