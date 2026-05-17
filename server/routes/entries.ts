import { Router } from "express";
import { db } from "../db";
import { entries } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export function createEntriesRoutes(authenticate: any) {
  const router = Router();

  // Get all entries
  router.get("/", authenticate, async (req, res) => {
    try {
      const allEntries = await db.select().from(entries).orderBy(desc(entries.id));
      res.json(allEntries);
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create/upsert entry
  router.post("/", authenticate, async (req, res) => {
    try {
      const { date, aaronWords, electraWords, aaronTime, electraTime, note } = req.body;

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

      res.json({ ...result[0], status: "upserted" });
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update entry
  router.patch("/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { aaronWords, electraWords, aaronTime, electraTime, note } = req.body;
      const updateData: any = { updatedAt: new Date() };

      if (aaronWords !== undefined) {
        const parsed = parseInt(aaronWords);
        if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Word counts must be non-negative integers" });
        updateData.aaronWords = parsed;
      }
      if (electraWords !== undefined) {
        const parsed = parseInt(electraWords);
        if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Word counts must be non-negative integers" });
        updateData.electraWords = parsed;
      }
      if (aaronTime !== undefined) {
        const parsed = parseInt(aaronTime);
        if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Time values must be non-negative integers" });
        updateData.aaronTime = parsed;
      }
      if (electraTime !== undefined) {
        const parsed = parseInt(electraTime);
        if (isNaN(parsed) || parsed < 0) return res.status(400).json({ error: "Time values must be non-negative integers" });
        updateData.electraTime = parsed;
      }
      if (note !== undefined) updateData.note = note;

      const result = await db.update(entries).set(updateData).where(eq(entries.id, id)).returning();
      if (result.length === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(result[0]);
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete entry
  router.delete("/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      await db.delete(entries).where(eq(entries.id, id));
      res.json({ status: "deleted" });
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
