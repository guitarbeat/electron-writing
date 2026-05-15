console.log("SERVER_BOOT: Starting server.ts execution...");

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: any;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
  
  const firebaseApp = admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });

  // Use getFirestore for specifying databaseId Correctlly
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  console.log(`Firebase Admin initialized for project ${firebaseConfig.projectId}, database ${firebaseConfig.firestoreDatabaseId}`);
} catch (error) {
  console.error("Critical: Failed to initialize Firebase Admin", error);
  process.exit(1);
}

const SESSION_SECRET = process.env.CLEAN_WRITER_PASSCODE || "temporary-fallback-secret-for-dev";
const COOKIE_NAME = "clean_writer_session";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
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

  // Session
  app.post("/api/session", (req, res) => {
    const { passcode } = req.body;
    const expectedPasscode = process.env.CLEAN_WRITER_PASSCODE || "0000"; // Default for easier recovery
    if (passcode === expectedPasscode) {
      const token = jwt.sign({ authorized: true }, SESSION_SECRET, { expiresIn: "30d" });
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
      jwt.verify(token, SESSION_SECRET);
      res.json({ authorized: true });
    } catch (err) {
      res.json({ authorized: false });
    }
  });

  // Entries
  app.get("/api/entries", authenticate, async (req, res) => {
    try {
      const snapshot = await db.collection("entries").orderBy("date", "desc").get();
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/entries", authenticate, async (req, res) => {
    try {
      const { date, aaronWords, electraWords, note } = req.body;
      const aaronCount = Math.max(0, parseInt(aaronWords) || 0);
      const electraCount = Math.max(0, parseInt(electraWords) || 0);

      if (!date || (aaronCount <= 0 && electraCount <= 0)) {
        return res.status(400).json({ error: "Date and at least one positive word count required" });
      }

      const entryRef = db.collection("entries").doc(date);
      const existing = await entryRef.get();
      
      const entryData = {
        date,
        aaronWords: aaronCount,
        electraWords: electraCount,
        note: note || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (existing.exists) {
        await entryRef.update(entryData);
        res.json({ id: date, ...entryData, status: "updated" });
      } else {
        const newEntry = {
          ...entryData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await entryRef.set(newEntry);
        res.json({ id: date, ...newEntry, status: "created" });
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (aaronWords !== undefined) updateData.aaronWords = Math.max(0, parseInt(aaronWords) || 0);
      if (electraWords !== undefined) updateData.electraWords = Math.max(0, parseInt(electraWords) || 0);
      if (note !== undefined) updateData.note = note;

      await db.collection("entries").doc(id).update(updateData);
      res.json({ id, ...updateData });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/entries/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      await db.collection("entries").doc(id).delete();
      res.json({ status: "deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings
  app.get("/api/settings", authenticate, async (req, res) => {
    try {
      const doc = await db.collection("settings").doc("global").get();
      if (!doc.exists) {
        // Initial defaults
        const defaults = {
          personAName: "Aaron",
          personBName: "Electra",
          personAColor: "#ff4d8d",
          personBColor: "#7c3aed",
          teamColor: "#2b1720",
          goalsEnabled: true,
          individualGoalsEnabled: false,
          teamWeeklyGoal: 7000,
          personAWeeklyGoal: 3500,
          personBWeeklyGoal: 3500,
          activityThresholds: [250, 750, 1500],
          defaultChartView: "daily",
          defaultGridView: "team",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("settings").doc("global").set(defaults);
        return res.json(defaults);
      }
      res.json(doc.data());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/settings", authenticate, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("settings").doc("global").update(updateData);
      res.json(updateData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export/Import
  app.get("/api/export", authenticate, async (req, res) => {
    try {
      const entriesSnapshot = await db.collection("entries").orderBy("date", "asc").get();
      const settingsDoc = await db.collection("settings").doc("global").get();
      
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: settingsDoc.exists ? settingsDoc.data() : {},
        entries: entriesSnapshot.docs.map(doc => {
          const d = doc.data();
          return {
            ...d,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() || d.updatedAt,
          };
        }),
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
      const { entries, settings, mode } = req.body; 
      
      if (mode === "replace") {
        const currentEntries = await db.collection("entries").get();
        // Delete in chunks of 500
        const entryRefs = currentEntries.docs;
        for (let i = 0; i < entryRefs.length; i += 500) {
          const batch = db.batch();
          entryRefs.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      if (entries && Array.isArray(entries)) {
        for (let i = 0; i < entries.length; i += 500) {
          const batch = db.batch();
          const chunk = entries.slice(i, i + 500);
          for (const entry of chunk) {
            if (!entry.date) continue;
            const entryRef = db.collection("entries").doc(entry.date);
            batch.set(entryRef, {
              ...entry,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          await batch.commit();
        }
      }

      if (settings) {
        await db.collection("settings").doc("global").set({
          ...settings,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      res.json({ status: "ok", count: entries?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Middleware / Static Assets ---

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("SERVER_BOOT: Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false, // Disable HMR in middleware mode to be safe
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

startServer();
