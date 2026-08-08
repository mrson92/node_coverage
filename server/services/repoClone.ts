import path from "path";
import fs from "fs";
import crypto from "crypto";
import dns from "dns";
import { isIP } from "net";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

type RepoLanguage = "javascript" | "python" | "java" | "cpp";

export interface RepoFileEntry {
  path: string;
  size: number;
  language: RepoLanguage | null;
}

export interface RepoScanResult {
  repo: string;
  branch: string;
  fileCount: number;
  sourceFileCount: number;
  files: RepoFileEntry[];
  entryCandidates: string[];
}

const REPO_CACHE_ROOT = path.join(process.cwd(), ".repo-cache");
const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", ".next", "out",
  "coverage", ".cache", ".venv", "venv", "__pycache__", ".idea", ".vscode",
  ".tox", ".eggs", "target", ".gradle", ".mvn", "vendor",
]);
const SKIP_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "woff", "woff2",
  "ttf", "otf", "eot", "pdf", "zip", "gz", "tar", "tgz", "rar", "7z",
  "exe", "dll", "so", "dylib", "bin", "map", "lock", "node",
]);
const MAX_SOURCE_FILE_BYTES = 300 * 1024;

const EXT_LANGUAGE_MAP: Record<string, RepoLanguage> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "javascript", tsx: "javascript",
  py: "python", pyw: "python",
  java: "java",
  c: "cpp", h: "cpp", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp",
};

const ENTRY_HINTS = [
  "src/index.js", "src/index.ts", "index.js", "index.ts",
  "src/main.js", "src/main.ts", "src/main.py", "main.py",
  "src/main.java", "Main.java", "src/Main.java",
  "src/main.cpp", "main.cpp", "src/main.cc", "src/app.c",
  "src/app.js", "app.js", "server.js", "server.ts",
];

// ============================================================================
// Git URL 검증 (SSRF 방어): http(s) 스킴 + 공용 IP만 허용
// ============================================================================
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a === 255) return true;
  if (a === 169 && b === 254) return true; // link-local / 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1
  if (a === 198 && b === 18) return true; // 198.18.0.0/15
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped: IPv4 내부 주소 검증에 위임
    const v4 = lower.slice("::ffff:".length);
    return isIP(v4) === 4 && isPrivateIPv4(v4);
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
  if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 link-local
  if (lower.startsWith("2001:db8")) return true; // documentation
  return false;
}

function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !isPrivateIPv4(ip);
  if (family === 6) return !isPrivateIPv6(ip);
  return false;
}

async function resolveHostAddresses(host: string): Promise<string[]> {
  if (isIP(host) !== 0) return [host];
  return new Promise((resolve, reject) => {
    dns.lookup(host, { all: true }, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses.map((a) => a.address));
    });
  });
}

// Git 클론 대상 URL만 허용 (공용 호스트 한정)
export async function assertSafeGitUrl(rawUrl: string): Promise<void> {
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("Git 저장소 URL은 http:// 또는 https:// 로 시작해야 합니다.");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("유효하지 않은 Git 저장소 URL 입니다.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URL에 자격 증명(아이디/비밀번호)을 포함할 수 없습니다.");
  }
  const port = parsed.port ? Number(parsed.port) : null;
  if (port !== null && port !== 80 && port !== 443) {
    throw new Error("Git 저장소 URL은 기본 HTTP(S) 포트만 허용됩니다.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) {
    throw new Error("Git 저장소 URL에 호스트가 없습니다.");
  }
  if (host === "localhost") {
    throw new Error("로컬/사설 호스트의 Git 저장소는 허용되지 않습니다.");
  }
  const addresses = await resolveHostAddresses(host);
  if (addresses.length === 0) {
    throw new Error("Git 저장소 호스트를 해석할 수 없습니다.");
  }
  for (const addr of addresses) {
    if (!isPublicAddress(addr)) {
      throw new Error("사설/지역(내부 네트워크) 주소로의 Git 클론은 허용되지 않습니다.");
    }
  }
}

// ============================================================================
// Clone / Scan / Read
// ============================================================================
function detectRepoLanguage(filePath: string): RepoLanguage | null {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  return EXT_LANGUAGE_MAP[ext] || null;
}

function repoCacheDir(url: string, branch: string): string {
  const key = crypto.createHash("sha1").update(`${url}|${branch}`).digest("hex");
  return path.join(REPO_CACHE_ROOT, key);
}

async function ensureRepoCloned(url: string, branch: string): Promise<string> {
  const dir = repoCacheDir(url, branch);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };

  // 이미 캐시된 shallow clone이면 best-effort 갱신
  if (fs.existsSync(path.join(dir, ".git"))) {
    try {
      await execFileAsync("git", ["-C", dir, "fetch", "--depth", "1", "origin", `refs/heads/${branch}`], { timeout: 30000, env });
      await execFileAsync("git", ["-C", dir, "reset", "--hard", `origin/${branch}`], { timeout: 30000, env });
    } catch {
      // 네트워크 갱신 실패 시 캐시 유지
    }
    return dir;
  }

  fs.mkdirSync(path.dirname(dir), { recursive: true });

  await assertSafeGitUrl(url);

  const baseArgs = ["clone", "--depth", "1", "--single-branch"];
  try {
    await execFileAsync("git", [...baseArgs, "--branch", branch, url, dir], { timeout: 180000, env });
  } catch {
    await execFileAsync("git", [...baseArgs, url, dir], { timeout: 180000, env });
  }
  return dir;
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

function detectEntryCandidates(files: RepoFileEntry[]): string[] {
  const hintsIndex = new Map(files.map((f) => [f.path, f]));
  const found: string[] = [];
  for (const hint of ENTRY_HINTS) {
    if (hintsIndex.has(hint)) found.push(hint);
  }

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

export async function scanRepository(url: string, branch: string): Promise<RepoScanResult> {
  await assertSafeGitUrl(url);
  const rootDir = await ensureRepoCloned(url, branch);
  const files = scanRepoFiles(rootDir);
  const entryCandidates = detectEntryCandidates(files);
  return {
    repo: url,
    branch,
    fileCount: files.length,
    sourceFileCount: files.filter((f) => f.language).length,
    files,
    entryCandidates,
  };
}

export async function readRepoFile(url: string, branch: string, relPath: string): Promise<{ content: string; language: RepoLanguage | null }> {
  await assertSafeGitUrl(url);
  const rootDir = await ensureRepoCloned(url, branch);
  const absPath = resolveWithin(rootDir, relPath);
  const content = fs.readFileSync(absPath, "utf-8");
  return { content, language: detectRepoLanguage(relPath) };
}

export { REPO_CACHE_ROOT };