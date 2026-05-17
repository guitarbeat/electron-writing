import dotenv from "dotenv";
import fs from "fs";

// Load environment variables in order of priority
// 1. Local development overrides
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
// 2. Standard .env file
dotenv.config();
// 3. v0/Vercel environment (if running in that context)
if (fs.existsSync("/vercel/share/.env.project")) {
  dotenv.config({ path: "/vercel/share/.env.project" });
}

export const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
