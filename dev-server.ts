import { createApp } from "./server";

export async function startDevServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  console.log("SERVER_BOOT: Initializing Vite middleware...");
  try {
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
  } catch (viteError) {
    console.error("SERVER_BOOT: Failed to initialize Vite/Static middleware", viteError);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER_BOOT: Dev Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startDevServer();
}
