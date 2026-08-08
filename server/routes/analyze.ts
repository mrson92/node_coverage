import { Router } from "express";
import { runAnalysisExtraction, runBatchAnalysisExtraction } from "../services/gemini";
import type { BatchSourceFile, SupportedLanguage } from "../../src/types";

const router = Router();

const MAX_BATCH_FILES = 12;
const MAX_BATCH_TOTAL_BYTES = 700 * 1024;
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["javascript", "python", "java", "cpp"];

router.post("/api/analyze", async (req, res) => {
  const { code, language, requirements } = req.body || {};

  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "code is required." });
  }

  try {
    const results = await runAnalysisExtraction(code, language || "javascript", requirements || "");
    res.json(results);
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ error: error.message || "Static analysis pipeline failed to compile." });
  }
});

// 저장소 배치(다중 파일) 통합 분석
router.post("/api/analyze/batch", async (req, res) => {
  const { files, requirements } = req.body || {};

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "files (non-empty array) is required." });
  }
  if (files.length > MAX_BATCH_FILES) {
    return res.status(400).json({ error: `한 번에 최대 ${MAX_BATCH_FILES}개 파일까지 배치 분석할 수 있습니다.` });
  }

  const cleanFiles: BatchSourceFile[] = [];
  let totalBytes = 0;
  for (const f of files) {
    if (!f || typeof f.path !== "string" || typeof f.code !== "string" || !f.code.trim()) continue;
    const language = SUPPORTED_LANGUAGES.includes(f.language) ? f.language : "javascript";
    const code = f.code.trim();
    totalBytes += Buffer.byteLength(code, "utf8");
    cleanFiles.push({ path: f.path, language, code });
  }
  if (cleanFiles.length === 0) {
    return res.status(400).json({ error: "분석 가능한 소스 파일이 없습니다." });
  }
  if (totalBytes > MAX_BATCH_TOTAL_BYTES) {
    return res.status(400).json({ error: "배치 분석 대상 소스 총량이 너무 큽니다. 파일 수를 줄여주세요." });
  }

  try {
    const results = await runBatchAnalysisExtraction(cleanFiles, requirements || "");
    const mergedCode = cleanFiles
      .map((f) => `/** ===== FILE: ${f.path} (${f.language}) ===== */\n${f.code}`)
      .join("\n\n");
    res.json({
      mergedCode,
      results,
      fileCount: cleanFiles.length,
      totalBytes,
    });
  } catch (error: any) {
    console.error("Gemini Batch Analyze Error:", error);
    res.status(500).json({ error: error.message || "Batch static analysis failed to compile." });
  }
});

export default router;