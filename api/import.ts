import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_lib/db.js";
import { entries, settings } from "./_lib/schema.js";
import { isAuthenticated } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { entries: importEntries, settings: importSettings, mode } = req.body || {};
    
    await db.transaction(async (tx) => {
      if (mode === "replace") {
        await tx.delete(entries);
      }

      if (importEntries && Array.isArray(importEntries)) {
        for (const entry of importEntries) {
          if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) continue;

          const parsedAaron = parseInt(entry.aaronWords);
          const parsedElectra = parseInt(entry.electraWords);
          const parsedAaronTime = parseInt(entry.aaronTime);
          const parsedElectraTime = parseInt(entry.electraTime);

          if ((!isNaN(parsedAaron) && parsedAaron < 0) || (!isNaN(parsedElectra) && parsedElectra < 0) || 
              (!isNaN(parsedAaronTime) && parsedAaronTime < 0) || (!isNaN(parsedElectraTime) && parsedElectraTime < 0)) continue;

          await tx.insert(entries).values({
            id: entry.date,
            date: entry.date,
            aaronWords: isNaN(parsedAaron) ? 0 : parsedAaron,
            electraWords: isNaN(parsedElectra) ? 0 : parsedElectra,
            aaronTime: isNaN(parsedAaronTime) ? 0 : parsedAaronTime,
            electraTime: isNaN(parsedElectraTime) ? 0 : parsedElectraTime,
            note: entry.note || "",
            createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: entries.id,
            set: {
              aaronWords: isNaN(parsedAaron) ? 0 : parsedAaron,
              electraWords: isNaN(parsedElectra) ? 0 : parsedElectra,
              aaronTime: isNaN(parsedAaronTime) ? 0 : parsedAaronTime,
              electraTime: isNaN(parsedElectraTime) ? 0 : parsedElectraTime,
              note: entry.note || "",
              updatedAt: new Date(),
            }
          });
        }
      }

      if (importSettings) {
        const { id, createdAt, updatedAt, passcode, ...filteredSettings } = importSettings;
        await tx.insert(settings).values({
          ...filteredSettings,
          id: "global",
          isSetupComplete: true,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: settings.id,
          set: {
            ...filteredSettings,
            isSetupComplete: true,
            updatedAt: new Date(),
          }
        });
      }
    });
    return res.status(200).json({ status: "ok", count: importEntries?.length || 0 });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
