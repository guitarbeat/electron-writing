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

export function createApp() {
  const app = express();
  // Hardened passcode loading: handle potential quotes or extra whitespace from env vars
  const rawPasscode = process.env.PASSCODE || "0000";
  const APP_PASSCODE = rawPasscode.toString().trim().replace(/^["']|["']$/g, '');
  
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
      const secret = process.env.SESSION_SECRET || APP_PASSCODE;
      jwt.verify(token, secret as string);
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

  // Session
  app.post("/api/session", async (req, res) => {
    const { passcode } = req.body;
    
    // Fetch dynamic passcode from DB with fallback to env
    let expected = APP_PASSCODE.trim();
    try {
      const dbSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      if (dbSettings.length > 0 && dbSettings[0].passcode) {
        expected = dbSettings[0].passcode.trim();
        console.log(`AUTH_CHECK: Using dynamic passcode from database.`);
      } else {
        console.log(`AUTH_CHECK: Using fallback environment passcode.`);
      }
    } catch (err) {
      console.warn("AUTH_DB_CHECK_WARN: Could not fetch from DB, using env fallback", err);
    }
    
    // Debug logging for authentication issues
    const received = passcode ? passcode.toString().trim() : "MISSING";
    
    // MASTER OVERRIDE: The environment passcode always works, regardless of DB.
    // This ensures that if the user gets locked out by a DB change, they can always use the ENV one.
    const isMasterMatch = passcode && passcode.toString().trim() === APP_PASSCODE.trim();
    const isDbMatch = passcode && passcode.toString().trim() === expected;
    const isMatch = isMasterMatch || isDbMatch;

    console.log(`AUTH_CHECK: Received=[${received}], Expected(DB)=[${expected.replace(/./g, '*')}], Expected(ENV)=[${APP_PASSCODE.replace(/./g, '*')}], Match=${isMatch} (Master=${isMasterMatch}, DB=${isDbMatch})`);

    if (isMatch) {
      const secret = process.env.SESSION_SECRET || APP_PASSCODE;
      const token = jwt.sign({ authorized: true }, secret as string, { expiresIn: "30d" });
      const isProd = process.env.NODE_ENV === "production";
      
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        // Only require secure cookies in production
        // This fixes login issues on local http://localhost
        secure: process.env.NODE_ENV === "production",
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
      const secret = process.env.SESSION_SECRET || APP_PASSCODE;
      jwt.verify(token, secret as string);
      res.json({ authorized: true });
    } catch (err) {
      res.json({ authorized: false });
    }
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
      const { date, aaronWords, electraWords, note } = req.body;
      const parsedAaron = Math.max(0, parseInt(aaronWords) || 0);
      const parsedElectra = Math.max(0, parseInt(electraWords) || 0);

      if (!date || (parsedAaron === 0 && parsedElectra === 0 && !note)) {
        return res.status(400).json({ error: "Date and at least some content required" });
      }

      const existing = await db.select().from(entries).where(eq(entries.id, date)).limit(1);
      
      const entryData = {
        id: date,
        date: date,
        aaronWords: parsedAaron,
        electraWords: parsedElectra,
        note: note || "",
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db.update(entries).set(entryData).where(eq(entries.id, date));
        res.json({ ...entryData, status: "updated" });
      } else {
        const newEntry = {
          ...entryData,
          createdAt: new Date(),
        };
        await db.insert(entries).values(newEntry);
        res.json({ ...newEntry, status: "created" });
      }
    } catch (err: any) {
      console.error("API Error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/entries/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { aaronWords, electraWords, note } = req.body;
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (aaronWords !== undefined) updateData.aaronWords = Math.max(0, parseInt(aaronWords) || 0);
      if (electraWords !== undefined) updateData.electraWords = Math.max(0, parseInt(electraWords) || 0);
      if (note !== undefined) updateData.note = note;

      await db.update(entries).set(updateData).where(eq(entries.id, id));
      res.json({ id, ...updateData });
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
      const allowedFields = [
        "personAName", "personBName", "personAColor", "personBColor", 
        "teamColor", "goalsEnabled", "individualGoalsEnabled", 
        "personAWeeklyGoal", "personBWeeklyGoal", "activityThresholds",
        "defaultChartView", "defaultGridView", "isSetupComplete",
        "projectTitle", "metric", "projectGoal", "deadline", "startDate",
        "passcode"
      ];

      const filteredBody: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          filteredBody[field] = req.body[field];
        }
      }

      const currentSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      
      const updateData = {
        ...filteredBody,
        updatedAt: new Date(),
        lastModifiedBy: req.body.lastModifiedBy || "A Writer"
      };
      
      if (updateData.lastModifiedBy !== "System") {
        updateData.setupUpdateCount = (currentSettings[0]?.setupUpdateCount || 0) + 1;
      }

      await db.update(settings).set(updateData).where(eq(settings.id, "global"));
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
      
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: settingsResults.length > 0 ? settingsResults[0] : {},
        entries: allEntries.map(e => ({
          id: e.id,
          date: e.id,
          aaronWords: e.aaronWords,
          electraWords: e.electraWords,
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

        if (importEntries && Array.isArray(importEntries)) {
          for (const entry of importEntries) {
            if (!entry.date) continue;
            await tx.insert(entries).values({
              id: entry.date,
              date: entry.date,
              aaronWords: parseInt(entry.aaronWords) || 0,
              electraWords: parseInt(entry.electraWords) || 0,
              note: entry.note || "",
              createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
              updatedAt: new Date(),
            }).onConflictDoUpdate({
              target: entries.id,
              set: {
                aaronWords: parseInt(entry.aaronWords) || 0,
                electraWords: parseInt(entry.electraWords) || 0,
                note: entry.note || "",
                updatedAt: new Date(),
              }
            });
          }
        }

        if (importSettings) {
          // Sanitize import settings too
          const allowedFields = [
            "personAName", "personBName", "personAColor", "personBColor", 
            "teamColor", "goalsEnabled", "individualGoalsEnabled", 
            "personAWeeklyGoal", "personBWeeklyGoal", "activityThresholds",
            "defaultChartView", "defaultGridView", "isSetupComplete",
            "projectTitle", "metric", "projectGoal", "deadline", "startDate",
            "passcode"
          ];
          
          const filteredSettings: any = {};
          for (const field of allowedFields) {
            if (importSettings[field] !== undefined) {
              filteredSettings[field] = importSettings[field];
            }
          }

          await tx.insert(settings).values({
            id: "global",
            ...filteredSettings,
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
        app.get(/.*/, (req, res) => {
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
  startServer();
}
