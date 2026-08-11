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
  "passcode", "theme"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isAuth = isAuthenticated(req);

  // GET - Get settings (public for theme, title, etc; sensitive fields stripped if unauthenticated)
  if (req.method === "GET") {
    try {
      const results = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      let data = results.length > 0 ? results[0] : { ...DEFAULT_SETTINGS, updatedAt: new Date() };
      if (results.length === 0) {
        await db.insert(settings).values(data);
      }
      if (!isAuth) {
        const { passcode, ...publicSettings } = data;
        return res.status(200).json(publicSettings);
      }
      return res.status(200).json(data);
    } catch (err: any) {
      console.warn("API Error (Settings GET):", err.message);
      const defaults = { ...DEFAULT_SETTINGS, updatedAt: new Date() };
      if (!isAuth) {
        const { passcode, ...publicDefaults } = defaults;
        return res.status(200).json(publicDefaults);
      }
      return res.status(200).json(defaults);
    }
  }

  // PATCH - Update settings
  if (req.method === "PATCH") {
    const isThemeOnly = req.body && Object.keys(req.body).every(k => k === 'theme' || k === 'lastModifiedBy');

    if (!isAuth && !isThemeOnly) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
      
      if (updateData.lastModifiedBy !== "System" && !isThemeOnly) {
        updateData.setupUpdateCount = (currentSettings[0]?.setupUpdateCount || 0) + 1;
      }

      if (currentSettings.length === 0) {
        await db.insert(settings).values({
          ...DEFAULT_SETTINGS,
          id: "global",
          ...updateData
        });
      } else {
        await db.update(settings).set(updateData).where(eq(settings.id, "global"));
      }

      return res.status(200).json(updateData);
    } catch (err: any) {
      console.error("API Error:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
