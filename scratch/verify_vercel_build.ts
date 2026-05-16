import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

async function verifyVercelAPI() {
  console.log("Building Vercel API bundle locally...");
  const outdir = path.join(process.cwd(), "scratch/dist");
  const outfile = path.join(outdir, "api_entry.cjs");

  try {
    await esbuild.build({
      entryPoints: ["api/[...path].ts"],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile,
      external: [
        "express", "dotenv", "drizzle-orm", "cookie-parser", "jsonwebtoken", "pg", "uuid", "vite", "path", "fs"
      ] // mock packages the serverless function assumes are available via layer or external.
    });

    console.log("Bundle created at", outfile);

    // Read the bundle to do a static check
    const code = fs.readFileSync(outfile, "utf-8");
    if (code.includes('require("vite")')) {
        console.error("❌ FAILED: Found require('vite') in the bundled Vercel function.");
        process.exit(1);
    }

    if (code.includes('require("rollup")')) {
        console.error("❌ FAILED: Found require('rollup') in the bundled Vercel function.");
        process.exit(1);
    }

    console.log("✅ Static check passed: no obvious require('vite') found.");

    // Now simulate loading the bundle as the serverless environment would
    process.env.VERCEL = "1";
    process.env.NODE_ENV = "production";

    console.log("Loading module to verify Express instantiation...");
    const mod = await import(path.resolve(outfile));

    const appExport = mod.default?.default || mod.default;

    if (typeof appExport === "function" && appExport.name === "app") {
        console.log("✅ Dynamic check passed: Module exported Express app correctly.");
    } else {
        console.error("❌ FAILED: Module default export does not look like an Express app.", mod);
        process.exit(1);
    }

    console.log("🎉 All checks passed! Vercel API trace appears safe.");
    process.exit(0);

  } catch (err) {
    console.error("Build or execution failed", err);
    process.exit(1);
  }
}

verifyVercelAPI();
