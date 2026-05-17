import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE_URL } from "./config";

// Lazy-initialized database connection
let _db: NodePgDatabase | null = null;

export function getDb(): NodePgDatabase {
  if (!_db) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
    }
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    _db = drizzle({ client: pool });
  }
  return _db;
}

// For backwards compatibility - but this will throw if DATABASE_URL is missing
// Use getDb() for lazy initialization in routes
export const db = new Proxy({} as NodePgDatabase, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
