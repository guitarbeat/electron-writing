import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./server/db/config";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL!,
  },
});
