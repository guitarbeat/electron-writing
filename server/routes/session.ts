import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "clean_writer_session";

export function createSessionRoutes(APP_PASSCODE: string, SESSION_SECRET: string) {
  const router = Router();

  // Create session (login)
  router.post("/", async (req, res) => {
    try {
      const { passcode } = req.body;
      
      // Fetch dynamic passcode from DB with fallback to env
      let expected = APP_PASSCODE.trim();
      try {
        const dbSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
        if (dbSettings.length > 0 && dbSettings[0].passcode) {
          expected = dbSettings[0].passcode.trim();
          console.log(`AUTH_CHECK: Using dynamic passcode from database.`);
        } else {
          console.log(`AUTH_CHECK: No DB passcode found, using environment passcode.`);
        }
      } catch (dbErr: any) {
        // Database query failed - just use environment passcode
        console.warn("AUTH_DB_CHECK_WARN: Could not fetch from DB, using env fallback.", dbErr.message);
      }
      
      const received = passcode !== undefined && passcode !== null ? String(passcode).trim() : "MISSING";
      
      // MASTER OVERRIDE: The environment passcode always works
      const isMasterMatch = received !== "MISSING" && received === APP_PASSCODE;
      const isDbMatch = received !== "MISSING" && received === expected;
      const isMatch = isMasterMatch || isDbMatch;

      console.log(`AUTH_CHECK: Received=[${received}], Expected(DB)=[${expected.replace(/./g, '*')}], Expected(ENV)=[${APP_PASSCODE.replace(/./g, '*')}], Match=${isMatch}`);

      if (isMatch) {
        const token = jwt.sign({ authorized: true }, SESSION_SECRET, { expiresIn: "30d" });
        const isProd = process.env.NODE_ENV === "production";
        
        res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        console.log(`AUTH_SUCCESS: Session established for 30 days. Secure=${isProd}`);
        return res.json({ status: "ok" });
      }
      return res.status(401).json({ error: "Invalid passcode" });
    } catch (err: any) {
      console.error("AUTH_ERROR: Unexpected error in login endpoint", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete session (logout)
  router.delete("/", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ status: "ok" });
  });

  // Check session status
  router.get("/check", (req, res) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.json({ authorized: false });
    try {
      jwt.verify(token, SESSION_SECRET);
      res.json({ authorized: true });
    } catch (err) {
      res.json({ authorized: false });
    }
  });

  // Bypass after 3 failed attempts
  router.post("/bypass", (req, res) => {
    const { attempts } = req.body;
    if (typeof attempts !== "number" || attempts < 3) {
      return res.status(403).json({ error: "Not yet" });
    }
    console.log(`AUTH_BYPASS: Smeemo is letting the user through after ${attempts} failed attempts.`);
    const token = jwt.sign({ authorized: true, bypass: true }, SESSION_SECRET, { expiresIn: "30d" });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ status: "ok", bypass: true });
  });

  return router;
}
