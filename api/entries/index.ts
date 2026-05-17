import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db";
import { entries } from "../_lib/schema";
import { eq, desc } from "drizzle-orm";
import { isAuthenticated } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List all entries
  if (req.method === "GET") {
    try {
      const allEntries = await db.select().from(entries).orderBy(desc(entries.id));
      return res.status(200).json(allEntries);
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST - Create/upsert entry
  if (req.method === "POST") {
    try {
      const { date, aaronWords, electraWords, aaronTime, electraTime, note } = req.body || {};

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Valid date in YYYY-MM-DD format required" });
      }

      const parsedAaron = parseInt(aaronWords);
      const parsedElectra = parseInt(electraWords);
      const parsedAaronTime = parseInt(aaronTime);
      const parsedElectraTime = parseInt(electraTime);

      if (
        (aaronWords !== undefined && (isNaN(parsedAaron) || parsedAaron < 0)) ||
        (electraWords !== undefined && (isNaN(parsedElectra) || parsedElectra < 0)) ||
        (aaronTime !== undefined && (isNaN(parsedAaronTime) || parsedAaronTime < 0)) ||
        (electraTime !== undefined && (isNaN(parsedElectraTime) || parsedElectraTime < 0))
      ) {
        return res.status(400).json({ error: "Values must be non-negative integers" });
      }

      const finalAaron = isNaN(parsedAaron) ? 0 : parsedAaron;
      const finalElectra = isNaN(parsedElectra) ? 0 : parsedElectra;
      const finalAaronTime = isNaN(parsedAaronTime) ? 0 : parsedAaronTime;
      const finalElectraTime = isNaN(parsedElectraTime) ? 0 : parsedElectraTime;

      if (finalAaron === 0 && finalElectra === 0 && finalAaronTime === 0 && finalElectraTime === 0 && !note) {
        return res.status(400).json({ error: "At least some content required" });
      }

      const entryData = {
        id: date,
        date: date,
        aaronWords: finalAaron,
        electraWords: finalElectra,
        aaronTime: finalAaronTime,
        electraTime: finalElectraTime,
        note: note || "",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const result = await db.insert(entries)
        .values(entryData)
        .onConflictDoUpdate({
          target: entries.id,
          set: {
            aaronWords: finalAaron,
            electraWords: finalElectra,
            aaronTime: finalAaronTime,
            electraTime: finalElectraTime,
            note: note || "",
            updatedAt: new Date()
          }
        })
        .returning();

      return res.status(200).json({ ...result[0], status: "upserted" });
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
