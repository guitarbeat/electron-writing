import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DATABASE_URL, DATABASE_POOL_MAX } from "./config";
import * as schema from "./schema";

const { Pool } = pg;

let pool;
let dbInstance;

if (process.env.NODE_ENV === "test") {
  // In test mode without a real DB URL, mock the connection
  pool = new Pool({ connectionString: DATABASE_URL || "postgres://dummy:dummy@localhost/dummy", max: 1 });
  dbInstance = drizzle(pool, { schema });
  // Mock common functions to prevent hang in tests
  dbInstance.select = () => ({
    from: () => ({
      where: () => ({
        limit: () => [],
        orderBy: () => [],
      }),
      orderBy: () => [],
    }),
  }) as any;
  dbInstance.insert = () => ({ values: () => ({ onConflictDoUpdate: () => [] }) }) as any;
  dbInstance.update = () => ({ set: () => ({ where: () => [] }) }) as any;
  dbInstance.delete = () => ({ where: () => [] }) as any;
  dbInstance.transaction = async (cb: any) => { await cb(dbInstance); };
} else {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: DATABASE_POOL_MAX,
  });

  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance;
