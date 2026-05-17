import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default defineConfig({
  schema: "./api/_lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL!,
  },
});
