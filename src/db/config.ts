import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

export const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

if (!DATABASE_URL && process.env.NODE_ENV !== "test") {
  // We don't throw in test mode to allow mocking or CI runs
  console.warn("Warning: DATABASE_URL or POSTGRES_URL environment variable is missing.");
}

export const DATABASE_POOL_MAX = Number(process.env.DATABASE_POOL_MAX || 5);
