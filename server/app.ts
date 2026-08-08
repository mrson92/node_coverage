import express from "express";
import analyzeRouter from "./routes/analyze";
import optimizeRouter from "./routes/optimize";
import repoRouter from "./routes/repo";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(analyzeRouter);
  app.use(optimizeRouter);
  app.use(repoRouter);

  return app;
}