import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DATABASE_URL, DATABASE_POOL_MAX } from "./config";
import * as schema from "./schema";

const { Pool } = pg;

let dbInstance: NodePgDatabase<typeof schema>;

if (DATABASE_URL) {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: DATABASE_POOL_MAX,
  });
  dbInstance = drizzle(pool, { schema });
} else {
  dbInstance = new Proxy({} as any, {
    get(target, prop) {
      if (prop === "then") return undefined;
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required to access the database.");
    }
  });
}

export const db = dbInstance;
