import express from "express";
import analyzeRouter from "./routes/analyze";
import optimizeRouter from "./routes/optimize";
import repoRouter from "./routes/repo";
import authRouter, { requireAuth } from "./routes/auth";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", authRouter);

  // 인증된 사용자만 /api/* 분석/최적화/저장소 스캔 API 접근 가능 (정적 자산은 미보호)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      requireAuth(req, res, next);
    } else {
      next();
    }
  });
  app.use(analyzeRouter);
  app.use(optimizeRouter);
  app.use(repoRouter);

  return app;
}