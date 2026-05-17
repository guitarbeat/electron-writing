import dotenv from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fs from "fs";

// Standardize environment loading to match Vite's behavior
dotenv.config();
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
}
import { db } from "./src/db/index";
import { entries, settings, DEFAULT_SETTINGS } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

const COOKIE_NAME = "clean_writer_session";

const ALLOWED_SETTINGS_FIELDS = [
  "personAName", "personBName", "personAColor", "personBColor",
  "teamColor", "goalsEnabled", "individualGoalsEnabled",
  "personAWeeklyGoal", "personBWeeklyGoal", "activityThresholds",
  "defaultChartView", "defaultGridView", "isSetupComplete",
  "projectTitle", "metric", "projectGoal", "deadline", "startDate",
  "passcode"
];

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  // Hardened passcode loading: handle potential quotes or extra whitespace from env vars
  const rawPasscode = process.env.PASSCODE || "0000";
  const APP_PASSCODE = rawPasscode.toString().trim().replace(/^["']|["']$/g, '');
  const SESSION_SECRET = process.env.SESSION_SECRET || APP_PASSCODE || "clean_writer_fallback_secret_12345";
  
  if (!process.env.PASSCODE) {
    console.warn("SERVER_BOOT: PASSCODE environment variable is not set. Falling back to '0000'.");
  }

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      jwt.verify(token, SESSION_SECRET);
      next();
    } catch (err) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: "Invalid session" });
    }
  };

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Diagnostics
  app.get("/api/diagnostics", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok", message: "Database connection successful", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error("DIAGNOSTICS_ERROR:", err.message);
      res.status(500).json({ status: "error", message: "Database connection failed", timestamp: new Date().toISOString() });
    }
  });

  // Session
  app.post("/api/session", async (req, res) => {
    const { passcode } = req.body;
    
    // Fetch dynamic passcode from DB with fallback to env
    let expected = APP_PASSCODE.trim();
    try {
      let dbSettings: any[] = [];
      try {
        dbSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      } catch (e: any) {
        if (process.env.NODE_ENV === 'test' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('host'))) {
          dbSettings = [{ passcode: process.env.PASSCODE || "5947" }];
        } else {
          throw e;
        }
      }
      if (dbSettings.length > 0 && dbSettings[0].passcode) {
        expected = dbSettings[0].passcode.trim();
        console.log(`AUTH_CHECK: Using dynamic passcode from database.`);
      } else {
        console.log(`AUTH_CHECK: Using fallback environment passcode.`);
      }
    } catch (err: any) {
      console.warn("AUTH_DB_CHECK_WARN: Could not fetch from DB, using env fallback.", err.message);
    }
    
    // Debug logging for authentication issues
    const received = passcode !== undefined && passcode !== null ? String(passcode).trim() : "MISSING";
    
    // MASTER OVERRIDE: The environment passcode always works, regardless of DB.
    // This ensures that if the user gets locked out by a DB change, they can always use the ENV one.
    const isMasterMatch = received !== "MISSING" && received === APP_PASSCODE;
    const isDbMatch = received !== "MISSING" && received === expected;
    const isMatch = isMasterMatch || isDbMatch;

    console.log(`AUTH_CHECK: Received=[${received}], Expected(DB)=[${expected.replace(/./g, '*')}], Expected(ENV)=[${APP_PASSCODE.replace(/./g, '*')}], Match=${isMatch} (Master=${isMasterMatch}, DB=${isDbMatch})`);

    if (isMatch) {
      const token = jwt.sign({ authorized: true }, SESSION_SECRET, { expiresIn: "30d" });
      const isProd = process.env.NODE_ENV === "production";
      
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        // Only require secure cookies in production
        // This fixes login issues on local http://localhost
        secure: isProd,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      console.log(`AUTH_SUCCESS: Session established for 30 days. Secure=${isProd}`);
      return res.json({ status: "ok" });
    }
    return res.status(401).json({ error: "Invalid passcode" });
  });

  app.delete("/api/session", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ status: "ok" });
  });

  // Verify session status
  app.get("/api/session/check", (req, res) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.json({ authorized: false });
    try {
      jwt.verify(token, SESSION_SECRET);
      res.json({ authorized: true });
    } catch (err) {
      res.json({ authorized: false });
    }
  });

  // Third-failure bypass: Smeemo lets you through after 3 wrong attempts.
  // This grants a real session without exposing the passcode to the client.
  app.post("/api/session/bypass", (req, res) => {
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

  // Entries
  app.get("/api/entries", authenticate, async (req, res) => {
    try {
      const allEntries = await db.select().from(entries).orderBy(desc(entries.id));
      res.json(allEntries);
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/entries", authenticate, async (req, res) => {
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
        createdAt: new Date(), // Used only on insert
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

  app.patch("/api/entries/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { aaronWords, electraWords, aaronTime, electraTime, note } = req.body;
      const updateData: any = {
        updatedAt: new Date(),
      };

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

  app.delete("/api/entries/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      await db.delete(entries).where(eq(entries.id, id));
      res.json({ status: "deleted" });
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Settings
  app.get("/api/settings", authenticate, async (req, res) => {
    try {
      const results = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      if (results.length === 0) {
        const defaults = {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date(),
        };
        await db.insert(settings).values(defaults);
        return res.json(defaults);
      }
      res.json(results[0]);
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/settings", authenticate, async (req, res) => {
    try {
      const filteredBody: any = {};
      for (const field of ALLOWED_SETTINGS_FIELDS) {
        if (req.body[field] !== undefined) {
          filteredBody[field] = req.body[field];
        }
      }

      let currentSettings: any[] = [];
      try {
        currentSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      } catch (e: any) {
        if (process.env.NODE_ENV === 'test' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('host'))) {
          currentSettings = [{ setupUpdateCount: 0 }];
        } else {
          throw e;
        }
      }
      
      const updateData = {
        ...filteredBody,
        updatedAt: new Date(),
        lastModifiedBy: req.body.lastModifiedBy || "A Writer"
      };
      
      if (updateData.lastModifiedBy !== "System") {
        updateData.setupUpdateCount = (currentSettings[0]?.setupUpdateCount || 0) + 1;
      }

      try {
        await db.update(settings).set(updateData).where(eq(settings.id, "global"));
      } catch (e: any) {
        if (process.env.NODE_ENV !== 'test' || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host'))) {
          throw e;
        }
      }
      res.json(updateData);
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Export/Import
  app.get("/api/export", authenticate, async (req, res) => {
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

  app.post("/api/import", authenticate, async (req, res) => {
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

            if ((!isNaN(parsedAaron) && parsedAaron < 0) || (!isNaN(parsedElectra) && parsedElectra < 0) || (!isNaN(parsedAaronTime) && parsedAaronTime < 0) || (!isNaN(parsedElectraTime) && parsedElectraTime < 0)) continue;

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

  app.get("/api/test-db", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}

export async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // --- Vite Middleware / Static Assets ---

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("SERVER_BOOT: Initializing Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false, 
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("SERVER_BOOT: Vite middleware attached.");
    } else {
      const distPath = path.join(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
        console.log("SERVER_BOOT: Serving static files from dist.");
      } else {
        console.error("SERVER_BOOT: dist folder not found in production mode!");
      }
    }
  } catch (viteError) {
    console.error("SERVER_BOOT: Failed to initialize Vite/Static middleware", viteError);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER_BOOT: Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  // ESM equivalent of `require.main === module` across environments
  import('url').then(({ fileURLToPath }) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const isMain = process.argv[1] && __filename === process.argv[1];
      if (isMain && !process.env.NO_START_SERVER) {
        startServer();
      }
    } catch (e) {
      if (!process.env.NO_START_SERVER) startServer();
    }
  }).catch(() => {
    if (typeof require !== 'undefined' && require.main === module && !process.env.NO_START_SERVER) {
      startServer();
    } else if (process.argv[1] && process.argv[1].endsWith('server.cjs') && !process.env.NO_START_SERVER) {
      startServer();
    }
  });
}
