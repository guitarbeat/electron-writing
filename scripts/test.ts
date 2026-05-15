import { db } from "../src/db/index.js";
import { entries, settings } from "../src/db/schema.js";

async function main() {
  await db.insert(entries).values({ id: '2026-05-15', date: '2026-05-15', aaronWords: 10, electraWords: 20 }).onConflictDoNothing();
  const result = await db.select().from(entries);
  console.log("DB select entries result: ", result);
  const s = await db.select().from(settings);
  console.log("Settings: ", s);
}
main();
