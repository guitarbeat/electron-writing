import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/db.js";
import { settings, DEFAULT_SETTINGS } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../../src/lib/auth.js";

const ALLOWED_SETTINGS_FIELDS = [
  "personAName", "personBName", "personAColor", "personBColor",
  "teamColor", "goalsEnabled", "individualGoalsEnabled",
  "personAWeeklyGoal", "personBWeeklyGoal", "activityThresholds",
  "defaultChartView", "defaultGridView", "isSetupComplete",
  "projectTitle", "metric", "projectGoal", "deadline", "startDate",
  "passcode"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - Get settings
  if (req.method === "GET") {
    try {
      const results = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      if (results.length === 0) {
        const defaults = {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date(),
        };
        await db.insert(settings).values(defaults);
        return res.status(200).json(defaults);
      }
      return res.status(200).json(results[0]);
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // PATCH - Update settings
  if (req.method === "PATCH") {
    try {
      const filteredBody: any = {};
      for (const field of ALLOWED_SETTINGS_FIELDS) {
        if (req.body?.[field] !== undefined) {
          filteredBody[field] = req.body[field];
        }
      }

      const currentSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      
      const updateData: any = {
        ...filteredBody,
        updatedAt: new Date(),
        lastModifiedBy: req.body?.lastModifiedBy || "A Writer"
      };
      
      if (updateData.lastModifiedBy !== "System") {
        updateData.setupUpdateCount = (currentSettings[0]?.setupUpdateCount || 0) + 1;
      }

      await db.update(settings).set(updateData).where(eq(settings.id, "global"));
      return res.status(200).json(updateData);
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
