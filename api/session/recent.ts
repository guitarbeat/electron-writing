import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../src/db/db.js";
import { settings } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const dbSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      if (dbSettings.length > 0) {
        return res.status(200).json({
          lastVisitIp: dbSettings[0].lastVisitIp,
          lastVisitTime: dbSettings[0].lastVisitTime,
          lastVisitDevice: dbSettings[0].lastVisitDevice
        });
      }
      return res.status(200).json({});
    } catch (err: any) {
      console.error("AUTH_ERROR:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
