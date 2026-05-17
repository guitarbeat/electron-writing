import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_lib/db";
import { settings } from "../_lib/schema";
import { eq } from "drizzle-orm";
import { APP_PASSCODE, createSessionToken, setCookieHeader, clearCookieHeader } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POST - Create session (login)
  if (req.method === "POST") {
    try {
      const { passcode } = req.body || {};
      
      // Fetch dynamic passcode from DB with fallback to env
      let expected = APP_PASSCODE;
      try {
        const dbSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
        if (dbSettings.length > 0 && dbSettings[0].passcode) {
          expected = dbSettings[0].passcode.trim();
        }
      } catch (dbErr: any) {
        console.warn("AUTH_DB_CHECK_WARN: Could not fetch from DB, using env fallback.", dbErr.message);
      }
      
      const received = passcode !== undefined && passcode !== null ? String(passcode).trim() : "";
      
      // Check against both DB passcode and env passcode (master override)
      const isMasterMatch = received && received === APP_PASSCODE;
      const isDbMatch = received && received === expected;
      const isMatch = isMasterMatch || isDbMatch;

      if (isMatch) {
        const token = createSessionToken({ authorized: true });
        res.setHeader("Set-Cookie", setCookieHeader(token));
        return res.status(200).json({ status: "ok" });
      }
      return res.status(401).json({ error: "Invalid passcode" });
    } catch (err: any) {
      console.error("AUTH_ERROR:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // DELETE - Logout
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearCookieHeader());
    return res.status(200).json({ status: "ok" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
