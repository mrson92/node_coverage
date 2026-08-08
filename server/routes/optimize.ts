import { Router } from "express";
import { runCoverageOptimization } from "../services/gemini";

const router = Router();

router.post("/api/optimize", async (req, res) => {
  const { uncoveredNodeId, code, language, nodeDescription } = req.body || {};

  if (typeof uncoveredNodeId !== "string" || typeof code !== "string") {
    return res.status(400).json({ error: "uncoveredNodeId and code are required." });
  }

  try {
    const result = await runCoverageOptimization(
      uncoveredNodeId,
      typeof nodeDescription === "string" ? nodeDescription : "",
      code,
      language || "javascript"
    );
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Optimize Error:", error);
    res.status(500).json({ error: error.message || "Optimization simulation failed." });
  }
});

export default router;