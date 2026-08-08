import { Router } from "express";
import { scanRepository, readRepoFile } from "../services/repoClone";

const router = Router();

// Git 저장소 스캔 (clone -> file tree)
router.post("/api/repo/scan", async (req, res) => {
  const { url, branch } = req.body || {};
  const normalizedUrl = typeof url === "string" && url.trim() ? url.trim() : null;
  if (!normalizedUrl) {
    return res.status(400).json({ error: "Git repository URL is required." });
  }
  const targetBranch = typeof branch === "string" && branch.trim() ? branch.trim() : "main";

  try {
    const result = await scanRepository(normalizedUrl, targetBranch);
    res.json(result);
  } catch (error: any) {
    console.error("Git scan error:", error);
    res.status(500).json({ error: error.message || "Repository scan failed." });
  }
});

// Git 저장소 단일 소스 파일 읽기
router.post("/api/repo/file", async (req, res) => {
  const { url, branch, path: relPath } = req.body || {};
  const normalizedUrl = typeof url === "string" && url.trim() ? url.trim() : null;
  if (!normalizedUrl || typeof relPath !== "string" || !relPath.trim()) {
    return res.status(400).json({ error: "url and path are required." });
  }
  const targetBranch = typeof branch === "string" && branch.trim() ? branch.trim() : "main";

  try {
    const { content, language } = await readRepoFile(normalizedUrl, targetBranch, relPath);
    res.json({ path: relPath, content, language });
  } catch (error: any) {
    console.error("Git file read error:", error);
    res.status(500).json({ error: error.message || "File read failed." });
  }
});

export default router;