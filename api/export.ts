import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_lib/db.js";
import { entries, settings } from "./_lib/schema.js";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const allEntries = await db.select().from(entries).orderBy(entries.id);
    const settingsResults = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
    
    let safeSettings = {};
    if (settingsResults.length > 0) {
      const { passcode, ...restSettings } = settingsResults[0];
      safeSettings = restSettings;
    }

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: safeSettings,
      entries: allEntries.map(e => ({
        id: e.id,
        date: e.id,
        aaronWords: e.aaronWords,
        electraWords: e.electraWords,
        aaronTime: e.aaronTime,
        electraTime: e.electraTime,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=clean_writer_export.json");
    return res.status(200).send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
