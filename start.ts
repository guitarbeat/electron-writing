import express from "express";
import path from "path";
import fs from "fs";
import { createApp } from "./server";

export async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // --- Static Assets for Production ---
  try {
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
  } catch (error) {
    console.error("SERVER_BOOT: Failed to initialize static middleware", error);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER_BOOT: Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
