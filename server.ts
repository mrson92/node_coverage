import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const execFileAsync = promisify(execFile);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini Client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 2. CFG 분석 및 노드, 에지, RTM 자동 추출 API
app.post("/api/analyze", async (req, res) => {
  const { code, language, requirements } = req.body;

  try {
    const client = getAiClient();
    const systemPrompt = `You are an advanced software static analysis and Control Flow Graph (CFG) creation engine. 
Based on the programming language specific traits and user's source code, you must construct a CFG (nodes, control flow edges), calculate Cyclomatic Complexity, and build a Requirements Traceability Matrix (RTM) mapped to the provided system requirements.

Language-Specific Analysis Directives:
- C/C++: Track pointer references, macros, templates, and indirect jumps. Highlight dangling pointer possibilities.
- Java: Consider Polymorphism, dynamic binding, and inheritance. Highlight Yo-yo inheritance effects.
- JavaScript/Web: Model asynchronous event-driven async/await structures, promises, callbacks, and event loop context.
- Python: Address dynamic typing runtime type transformations, dynamic function maps.

Ensure your JSON outputs exactly align with the specified schema type structure. DO NOT invent schema attributes.`;

    const userPrompt = `Source Code:
\`\`\`${language}
${code}
\`\`\`

System Requirements (NLP text or bullets):
${requirements || "General operational logic of the code"}

Extract the CFG nodes, edges, RTM tracking, cyclomatic complexity metrics, and language specific insights in JSON layout.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["nodes", "edges", "complexity", "languageInsights", "rtm"],
          properties: {
            nodes: {
              type: Type.ARRAY,
              description: "The execution base block blocks or decision points identified",
              items: {
                type: Type.OBJECT,
                required: ["id", "label", "type", "lineStart", "lineEnd", "reachability", "description"],
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Short 2-3 word label" },
                  type: { 
                    type: Type.STRING, 
                    description: "CFG Node classification",
                    enum: ["start", "basic", "decision", "call", "end"] 
                  },
                  lineStart: { type: Type.INTEGER },
                  lineEnd: { type: Type.INTEGER },
                  reachability: { 
                    type: Type.STRING, 
                    enum: ["reachable", "unreachable", "conditional"] 
                  },
                  description: { type: Type.STRING },
                  languageSpecificAspect: { type: Type.STRING, description: "Pointer jump, async handler, polymorphism annotation etc." }
                }
              }
            },
            edges: {
              type: Type.ARRAY,
              description: "CFG control flow connections from node to target",
              items: {
                type: Type.OBJECT,
                required: ["source", "target"],
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  condition: { type: Type.STRING, description: "Edge label condition like 'x > 5' or 'err !== null'" }
                }
              }
            },
            rtm: {
              type: Type.ARRAY,
              description: "NLP requirements trace links to code nodes",
              items: {
                type: Type.OBJECT,
                required: ["reqId", "reqText", "mappedNodeIds"],
                properties: {
                  reqId: { type: Type.STRING, description: "E.g., REQ-01" },
                  reqText: { type: Type.STRING },
                  mappedNodeIds: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                }
              }
            },
            complexity: {
              type: Type.OBJECT,
              required: ["cyclomaticComplexity", "totalNodes", "totalEdges"],
              properties: {
                cyclomaticComplexity: { type: Type.INTEGER },
                totalNodes: { type: Type.INTEGER },
                totalEdges: { type: Type.INTEGER }
              }
            },
            languageInsights: { 
              type: Type.STRING, 
              description: "Advanced specific text feedback analyzing semantic complexities and software erosion risks." 
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ error: error.message || "Static analysis pipeline failed to compile." });
  }
});

// 3. AI 기반 자율적 커버리지 최적화 (Symbolic Execution + TestCase + AutoFix) API
app.post("/api/optimize", async (req, res) => {
  const { uncoveredNodeId, code, language, nodeDescription } = req.body;

  try {
    const client = getAiClient();
    const systemPrompt = `You are a testing automation assistant focused on Agentic Coverage Solver. 
Analyze the target node and code, determine what symbolic constraints are required to navigate the execution paths into this node, spit out concrete Test case values, craft unit test mocks, and suggest code modifications (AutoFix) if the node is structurally blocked (dead code).`;

    const userPrompt = `We want to explore and cover the Node: "${uncoveredNodeId}" (${nodeDescription}) 
Codebase Context:
\`\`\`${language}
${code}
\`\`\`

Please output the target constraints, concrete parameter test values, automated unit test code, and refactoring Autofit suggestions to eliminate unreachable sections in strict JSON template matching.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["symbolicConstraints", "testInputs", "unitTestCode", "autofixSuggestion"],
          properties: {
            symbolicConstraints: { type: Type.STRING, description: "Symbolic path predicates in mathematical/logical terms" },
            testInputs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["param", "value", "explanation"],
                properties: {
                  param: { type: Type.STRING },
                  value: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            unitTestCode: { type: Type.STRING, description: "Full unit test case containing inputs and assertions" },
            autofixSuggestion: { type: Type.STRING, description: "Code block or narrative patching to resolve unreachable barriers" }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini Optimize Error:", error);
    res.status(500).json({ error: error.message || "Optimization simulation failed." });
  }
});

// ============================================================================
// 4. Real Git Repository Integration (clone -> scan -> read source files)
// ============================================================================
// Supported source languages derived from file extension
type RepoLanguage = "javascript" | "python" | "java" | "cpp";

const REPO_CACHE_ROOT = path.join(process.cwd(), ".repo-cache");
const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", ".next", "out",
  "coverage", ".cache", ".venv", "venv", "__pycache__", ".idea", ".vscode",
  ".tox", ".eggs", "target", ".gradle", ".mvn", "vendor",
]);
const SKIP_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "woff", "woff2",
  "ttf", "otf", "eot", "pdf", "zip", "gz", "tar", "tgz", "rar", "7z",
  "exe", "dll", "so", "dylib", "bin", "map", "lock", "node", "woff2",
]);
const MAX_SOURCE_FILE_BYTES = 300 * 1024; // skip generated/huge files

const EXT_LANGUAGE_MAP: Record<string, RepoLanguage> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "javascript", tsx: "javascript",
  py: "python", pyw: "python",
  java: "java",
  c: "cpp", h: "cpp", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp",
};

function detectRepoLanguage(filePath: string): RepoLanguage | null {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  return EXT_LANGUAGE_MAP[ext] || null;
}

function repoCacheKey(url: string, branch: string): string {
  return crypto.createHash("sha1").update(`${url}|${branch}`).digest("hex");
}

function repoCacheDir(url: string, branch: string): string {
  return path.join(REPO_CACHE_ROOT, repoCacheKey(url, branch));
}

async function ensureRepoCloned(url: string, branch: string): Promise<string> {
  const dir = repoCacheDir(url, branch);

  // Refresh an already-cached shallow clone (best-effort)
  if (fs.existsSync(path.join(dir, ".git"))) {
    try {
      await execFileAsync("git", ["-C", dir, "fetch", "--depth", "1", "origin", `refs/heads/${branch}`], { timeout: 30000 });
      await execFileAsync("git", ["-C", dir, "reset", "--hard", `origin/${branch}`], { timeout: 30000 });
    } catch (e) {
      // keep cached copy if network refresh fails
    }
    return dir;
  }

  fs.mkdirSync(path.dirname(dir), { recursive: true });

  // Try a shallow single-branch clone; fall back to default branch on failure
  const baseArgs = ["clone", "--depth", "1", "--single-branch"];
  try {
    await execFileAsync("git", [...baseArgs, "--branch", branch, url, dir], { timeout: 180000 });
  } catch (err) {
    await execFileAsync("git", [...baseArgs, url, dir], { timeout: 180000 });
  }
  return dir;
}

interface RepoFileEntry {
  path: string;
  size: number;
  language: RepoLanguage | null;
}

function scanRepoFiles(rootDir: string): RepoFileEntry[] {
  const results: RepoFileEntry[] = [];

  const walk = (relDir: string): void => {
    const absDir = path.join(rootDir, relDir);
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = path.join(relDir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(rel);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().replace(".", "");
        if (SKIP_EXTENSIONS.has(ext)) continue;
        try {
          const stat = fs.statSync(path.join(absDir, entry.name));
          if (stat.size > MAX_SOURCE_FILE_BYTES) continue;
          results.push({ path: rel, size: stat.size, language: detectRepoLanguage(rel) });
        } catch {
          // unreadable file, skip
        }
      }
    }
  };

  walk("");
  results.sort((a, b) => a.path.localeCompare(b.path));
  return results;
}

// Heuristic main entrypoint candidates ordered by priority
const ENTRY_HINTS = [
  "src/index.js", "src/index.ts", "index.js", "index.ts",
  "src/main.js", "src/main.ts", "src/main.py", "main.py",
  "src/main.java", "Main.java", "src/Main.java",
  "src/main.cpp", "main.cpp", "src/main.cc", "src/app.c",
  "src/app.js", "app.js", "server.js", "server.ts",
];

function detectEntryCandidates(files: RepoFileEntry[]): string[] {
  const hintsIndex = new Map(files.map((f) => [f.path, f]));
  const found: string[] = [];
  for (const hint of ENTRY_HINTS) {
    if (hintsIndex.has(hint)) found.push(hint);
  }

  // Prefer real source entrypoints: skip files under dot-directories and
  // non-source workflows, prioritize files with a detected language.
  const candidateFiles = files
    .filter((f) => !f.path.split("/").some((seg) => seg.startsWith(".")))
    .map((f) => ({
      ...f,
      isSource: f.language != null,
      isEntryName: /^(index|main|app|server)[._]/.test(path.basename(f.path)),
    }))
    .sort((a, b) => {
      const scoreA = (a.isSource ? 2 : 0) + (a.isEntryName ? 4 : 0);
      const scoreB = (b.isSource ? 2 : 0) + (b.isEntryName ? 4 : 0);
      return scoreB - scoreA || a.path.localeCompare(b.path);
    });

  for (const f of candidateFiles) {
    if (found.length >= 3) break;
    if (!found.includes(f.path)) found.push(f.path);
  }
  return found;
}

function resolveWithin(rootDir: string, relPath: string): string {
  const root = path.resolve(rootDir);
  const abs = path.resolve(root, relPath);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error("Invalid file path.");
  }
  return abs;
}

// 4a. Scan a real Git repository and return its source file tree
app.post("/api/repo/scan", async (req, res) => {
  const { url, branch } = req.body || {};
  const normalizedUrl = typeof url === "string" && url.trim() ? url.trim() : null;
  if (!normalizedUrl) {
    return res.status(400).json({ error: "Git repository URL is required." });
  }

  const targetBranch = typeof branch === "string" && branch.trim() ? branch.trim() : "main";

  try {
    const rootDir = await ensureRepoCloned(normalizedUrl, targetBranch);
    const files = scanRepoFiles(rootDir);
    const entryCandidates = detectEntryCandidates(files);
    res.json({
      repo: normalizedUrl,
      branch: targetBranch,
      fileCount: files.length,
      sourceFileCount: files.filter((f) => f.language).length,
      files,
      entryCandidates,
    });
  } catch (error: any) {
    console.error("Git scan error:", error);
    res.status(500).json({ error: error.message || "Repository scan failed." });
  }
});

// 4b. Read a single source file from a scanned Git repository
app.post("/api/repo/file", async (req, res) => {
  const { url, branch, path: relPath } = req.body || {};
  const normalizedUrl = typeof url === "string" && url.trim() ? url.trim() : null;
  if (!normalizedUrl || typeof relPath !== "string" || !relPath.trim()) {
    return res.status(400).json({ error: "url and path are required." });
  }

  const targetBranch = typeof branch === "string" && branch.trim() ? branch.trim() : "main";

  try {
    const rootDir = await ensureRepoCloned(normalizedUrl, targetBranch);
    const absPath = resolveWithin(rootDir, relPath);
    const content = fs.readFileSync(absPath, "utf-8");
    res.json({ path: relPath, content, language: detectRepoLanguage(relPath) });
  } catch (error: any) {
    console.error("Git file read error:", error);
    res.status(500).json({ error: error.message || "File read failed." });
  }
});

async function start() {
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
    app.get("*", (req, res) => {
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
