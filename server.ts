import path from "path";
import express from "express";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createApp } from "./server/app";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const app = createApp();

  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server Middleware setup
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static hosting
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Coverage System] Multi-language analyzer operating beautifully at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup Failure:", err);
});