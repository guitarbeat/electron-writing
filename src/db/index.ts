import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import pg from "pg";
import * as schema from "./schema";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DATABASE_POOL_MAX || 5),
});

export const db = drizzle(pool, { schema });
