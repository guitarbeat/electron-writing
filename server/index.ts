import dotenv from "dotenv";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs";

// Load environment variables
if (fs.existsSync("/vercel/share/.env.project")) {
  dotenv.config({ path: "/vercel/share/.env.project" });
}
dotenv.config();
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
}

import { db } from "./db";
import { createAuthMiddleware } from "./middleware/auth";
import { createSessionRoutes } from "./routes/session";
import { createEntriesRoutes } from "./routes/entries";
import { createSettingsRoutes } from "./routes/settings";
import { createDataRoutes } from "./routes/data";

export { db } from "./db";
export { entries, settings, DEFAULT_SETTINGS } from "./db/schema";
export type { Entry, Settings } from "./db/schema";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  
  // Hardened passcode loading
  const rawPasscode = process.env.PASSCODE || "0000";
  const APP_PASSCODE = rawPasscode.toString().trim().replace(/^["']|["']$/g, '');
  const SESSION_SECRET = process.env.SESSION_SECRET || APP_PASSCODE || "clean_writer_fallback_secret_12345";
  
  if (!process.env.PASSCODE) {
    console.warn("SERVER_BOOT: PASSCODE environment variable is not set. Falling back to '0000'.");
  }

  app.use(express.json());
  app.use(cookieParser());

  const authenticate = createAuthMiddleware(SESSION_SECRET);

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

  app.get("/api/test-db", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mount route modules
  app.use("/api/session", createSessionRoutes(APP_PASSCODE, SESSION_SECRET));
  app.use("/api/entries", createEntriesRoutes(authenticate));
  app.use("/api/settings", createSettingsRoutes(authenticate));
  app.use("/api", createDataRoutes(authenticate));

  return app;
}

export async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  try {
    // Skip Vite middleware if NO_VITE is set (backend-only mode for v0)
    if (process.env.NO_VITE) {
      console.log("SERVER_BOOT: Running in backend-only mode (NO_VITE=true)");
    } else if (process.env.NODE_ENV !== "production") {
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
      
      // Serve index.html for all non-API routes (SPA fallback)
      app.get("/{*path}", async (req, res, next) => {
        if (req.originalUrl.startsWith("/api/")) {
          return next();
        }
        try {
          const url = req.originalUrl;
          let template = fs.readFileSync(path.resolve("index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
      
      console.log("SERVER_BOOT: Vite middleware attached.");
    } else {
      const distPath = path.join(process.cwd(), "dist");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("/{*path}", (req, res) => {
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
