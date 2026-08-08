import { Router } from "express";
import { runAnalysisExtraction } from "../services/gemini";

const router = Router();

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

export default router;