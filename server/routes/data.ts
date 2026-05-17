import { Router } from "express";
import { db } from "../db";
import { entries, settings } from "../db/schema";
import { eq } from "drizzle-orm";

export function createDataRoutes(authenticate: any) {
  const router = Router();

  // Export data
  router.get("/export", authenticate, async (req, res) => {
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
      res.send(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Import data
  router.post("/import", authenticate, async (req, res) => {
    try {
      const { entries: importEntries, settings: importSettings, mode } = req.body; 
      
      await db.transaction(async (tx) => {
        if (mode === "replace") {
          await tx.delete(entries);
        }

        let validEntryCount = 0;
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
            validEntryCount++;
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
      res.json({ status: "ok", count: importEntries?.length || 0 });
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
