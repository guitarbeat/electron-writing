import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db";
import { entries } from "../_lib/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Entry ID required" });
  }

  // PATCH - Update entry
  if (req.method === "PATCH") {
    try {
      const { aaronWords, electraWords, aaronTime, electraTime, note } = req.body || {};
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
      return res.status(200).json(result[0]);
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE - Delete entry
  if (req.method === "DELETE") {
    try {
      await db.delete(entries).where(eq(entries.id, id));
      return res.status(200).json({ status: "deleted" });
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
