import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

async function migrate() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_NHSO0ZVXlC7e@ep-still-dawn-amq5bybq-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  const client = new pg.Client({ connectionString });
  
  await client.connect();
  console.log("Connected to database");

  try {
    const migrationDir = path.join(process.cwd(), "drizzle");
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith(".sql")).sort();
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      await client.query(sql);
    }
    
    console.log("Migrations successfully applied");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
