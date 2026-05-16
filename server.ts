import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fs from "fs";
import { db } from "./src/db/index";
import { entries, settings, DEFAULT_SETTINGS } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

const COOKIE_NAME = "clean_writer_session";

export function createApp() {
  const app = express();
  const APP_PASSCODE = process.env.PASSCODE || "0000";
  
  if (!process.env.PASSCODE) {
    console.warn("SERVER_BOOT: PASSCODE environment variable is not set. Falling back to '0000'.");
  }

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      jwt.verify(token, APP_PASSCODE as string);
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
  app.post("/api/session", (req, res) => {
    const { passcode } = req.body;
    if (passcode && passcode.toString().trim() === APP_PASSCODE.trim()) {
      const token = jwt.sign({ authorized: true }, APP_PASSCODE as string, { expiresIn: "30d" });
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
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
      jwt.verify(token, APP_PASSCODE as string);
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
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/entries/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      await db.delete(entries).where(eq(entries.id, id));
      res.json({ status: "deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/settings", authenticate, async (req, res) => {
    try {
      const currentSettings = await db.select().from(settings).where(eq(settings.id, "global")).limit(1);
      
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      if (req.body.lastModifiedBy !== "System") {
        updateData.setupUpdateCount = (currentSettings[0]?.setupUpdateCount || 0) + 1;
      }

      await db.update(settings).set(updateData).where(eq(settings.id, "global"));
      res.json(updateData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/import", authenticate, async (req, res) => {
    try {
      const { entries: importEntries, settings: importSettings, mode } = req.body; 
      
      if (mode === "replace") {
        await db.delete(entries);
      }

      if (importEntries && Array.isArray(importEntries)) {
        for (const entry of importEntries) {
          if (!entry.date) continue;
          await db.insert(entries).values({
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
        await db.insert(settings).values({
          id: "global",
          ...importSettings,
          isSetupComplete: true,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: settings.id,
          set: {
            ...importSettings,
            isSetupComplete: true,
            metric: importSettings.metric || "words",
            projectGoal: importSettings.projectGoal || 50000,
            deadline: importSettings.deadline || "2026-12-31",
            updatedAt: new Date(),
          }
        });
      }

      res.json({ status: "ok", count: importEntries?.length || 0 });
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
