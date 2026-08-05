import React, { useState, useCallback } from "react";
import {
  GitFork,
  Github,
  Network,
  FileCode,
  Search,
  FolderGit2,
  Check,
  AlertCircle,
  ArrowRight,
  FileText,
  Sparkles,
  Loader2,
  RefreshCcw,
  Braces,
} from "lucide-react";
import { SupportedLanguage } from "../types";

// Mirrors the server-side repository file entry shape
interface RepoFileEntry {
  path: string;
  size: number;
  language: SupportedLanguage | null;
}

interface MultiFileGitAnalyzerProps {
  onLoadResolvedCode: (language: SupportedLanguage, code: string, requirements: string) => void;
  currentLanguage: SupportedLanguage;
}

const LANG_LABEL: Record<SupportedLanguage, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C/C++",
};

const SCAN_STEPS = [
  "Connecting to remote repository terminal...",
  "Resolving symbolic references and branch commits...",
  "Cloning shallow working tree (--depth 1)...",
  "Parsing directory hierarchy structure...",
  "Filtering build artifacts and binary payloads...",
  "Indexing source files and detecting languages...",
];

export function MultiFileGitAnalyzer({ onLoadResolvedCode, currentLanguage }: MultiFileGitAnalyzerProps) {
  // Input states
  const [gitUrl, setGitUrl] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [entrypoint, setEntrypoint] = useState<string>("");

  // Lifecycle states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  // Real repository data
  const [files, setFiles] = useState<RepoFileEntry[]>([]);
  const [sourceFileCount, setSourceFileCount] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const loadFileContent = useCallback(async (url: string, br: string, relPath: string) => {
    setIsLoadingFile(true);
    try {
      const res = await fetch("/api/repo/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, branch: br, path: relPath }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File read failed.");
      }
      setFileContent(data.content || "");
    } catch (err: any) {
      setFileContent(`// 파일을 읽지 못했습니다: ${err.message}`);
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  const handleGitScan = async () => {
    const url = gitUrl.trim();
    if (!url) {
      setScanError("Git 저장소 URL을 입력해 주세요.");
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setHasScanned(false);
    setFiles([]);
    setFileContent("");
    setSelectedFile(null);

    // Animate progress steps while the clone runs in the background
    let currentIdx = 0;
    setScanStep(SCAN_STEPS[0]);
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < SCAN_STEPS.length) {
        setScanStep(SCAN_STEPS[currentIdx]);
      }
    }, 700);

    try {
      const res = await fetch("/api/repo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, branch: branch.trim() || "main" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Repository scan failed.");
      }

      const scannedFiles: RepoFileEntry[] = data.files || [];
      setFiles(scannedFiles);
      setSourceFileCount(data.sourceFileCount || 0);

      const candidate: string | undefined =
        data.entryCandidates?.[0] || scannedFiles[0]?.path;
      if (candidate) {
        setEntrypoint(candidate);
        setSelectedFile(candidate);
        await loadFileContent(url, branch.trim() || "main", candidate);
      }
      setHasScanned(true);
    } catch (err: any) {
      setScanError(err.message || "리포지토리 스캔에 실패했습니다.");
      setHasScanned(true);
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  const handleSelectFile = (filePath: string) => {
    setSelectedFile(filePath);
    if (gitUrl.trim()) {
      loadFileContent(gitUrl.trim(), branch.trim() || "main", filePath);
    }
  };

  const selectedEntry = files.find((f) => f.path === selectedFile) || null;
  const selectedLanguage: SupportedLanguage | null = selectedEntry?.language || null;

  const handleInjectToWorkspace = async () => {
    if (!selectedEntry) return;
    setIsInjecting(true);
    try {
      let content = fileContent;
      if (!content && gitUrl.trim()) {
        const res = await fetch("/api/repo/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: gitUrl.trim(),
            branch: branch.trim() || "main",
            path: selectedEntry.path,
          }),
        });
        const data = await res.json();
        if (res.ok) content = data.content || "";
      }

      const lang = selectedLanguage || currentLanguage;
      const header = `/**
 * REAL GIT SOURCE (${LANG_LABEL[lang] || "unknown"})
 * Repository: ${gitUrl.trim()}
 * File: ${selectedEntry.path}
 * Loaded via /api/repo/scan -> /api/repo/file
 */
`;
      const requirementsDefault = `소스 코드를 분석하여 진입점(Entry) 흐름의 기능 요건을 작성하십시오.
제어 흐름, 오류 처리, 보안 관련 경로를 기준으로 RTM 요건을 도출하십시오.`;

      onLoadResolvedCode(lang, header + content, requirementsDefault);
    } finally {
      setIsInjecting(false);
    }
  };

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div
      className="border border-[#222] bg-[#0c0c0c] rounded-sm p-5 font-sans relative overflow-hidden flex flex-col justify-between"
      id="git-multitask-entrypoint-analyzer"
    >
      {/* Visual Accent header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 border-b border-[#111] gap-2">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[#A1824A]" />
          <h3 className="text-xs font-bold text-stone-200">
            Real Git Repository Analyzer (실제 원격 깃 저장소 연계 소스 선택기)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2.5 py-0.5 rounded-sm border border-emerald-900/60">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-bounce" />
          <span>LIVE CLONE + LANGUAGE DETECTION</span>
        </div>
      </div>

      <div className="text-xs text-gray-400 leading-relaxed mb-4">
        로컬 파일을 붙여넣는 대신, <strong>실제 Git 저장소를 서버에서 shallow-clone</strong>하여
        소스 파일 트리를 구성합니다. 파일을 선택하면 확장자 기반으로 언어를 자동 판별하여
        코어 분석 워크벤치로 주입합니다. (<code className="text-[#A1824A] font-mono px-1 py-0.5 bg-[#14120e] rounded-xs">node_modules / dist / 바이너리</code>는 자동 제외)
      </div>

      {/* Input controls form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#080808]/80 border border-[#1a1a1a] p-4 rounded-sm mb-4">
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-gray-500 uppercase">Git Repository Remote URL</label>
          <div className="flex items-center gap-2 bg-[#0c0c0c] border border-[#222] px-2.5 py-1.5 rounded-xs">
            <Github className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              className="bg-transparent text-stone-200 text-[11px] font-sans border-0 w-full focus:outline-hidden"
              placeholder="https://github.com/user/repo.git"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-gray-500 uppercase">Target Branch</label>
          <div className="flex items-center gap-2 bg-[#0c0c0c] border border-[#222] px-2.5 py-1.5 rounded-xs">
            <GitFork className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent text-stone-200 text-[11px] font-mono border-0 w-full focus:outline-hidden"
            />
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-[#A1824A] uppercase font-bold">Detected Entrypoint (Auto)</label>
          <div className="flex items-center gap-2 bg-[#14120e] border border-[#A1824A]/40 px-2.5 py-1.5 rounded-xs">
            <FileCode className="w-3.5 h-3.5 text-[#A1824A]" />
            <input
              type="text"
              value={entrypoint}
              readOnly
              className="bg-transparent text-[#A1824A] text-[11px] font-mono font-bold border-0 w-full focus:outline-hidden"
              placeholder="스캔 후 자동 감지"
            />
          </div>
        </div>

        <div className="md:col-span-2 flex items-end">
          <button
            onClick={handleGitScan}
            disabled={isScanning}
            className="w-full py-2 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white text-xs font-bold rounded-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>원격 탐색 시작</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading analysis representation */}
      {isScanning && (
        <div className="border border-[#222] bg-[#080808]/40 rounded-sm p-6 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
          <Network className="w-6 h-6 text-[#A1824A] animate-spin" />
          <div>
            <span className="text-xs font-mono text-[#A1824A] block mb-1">Cloning &amp; scanning remote repository...</span>
            <span className="text-[10px] text-gray-500 font-sans">{scanStep}</span>
          </div>
        </div>
      )}

      {/* Main mapping interactive outcome panels */}
      {!isScanning && hasScanned && !scanError && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2 animate-fadeIn">
          {/* Resolved source file tree list (Left) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex justify-between items-center bg-[#111] px-3 py-2 rounded-xs border border-[#222]">
              <span className="text-[10px] font-mono text-stone-300 font-bold uppercase">
                Source Files ({files.length})
              </span>
              <span className="text-[9px] font-mono text-emerald-400">Scan Complete</span>
            </div>

            <div className="border border-[#222] rounded-xs bg-[#080808]/60 p-2 text-stone-400 space-y-1 max-h-[280px] overflow-auto">
              <span className="text-[9px] text-gray-500 font-mono block pl-2 mb-1.5 uppercase">Repository File Tree</span>
              {files.length === 0 && (
                <span className="text-[10px] text-gray-500 block pl-2">
                  분석 가능한 소스 파일이 없습니다.
                </span>
              )}
              {files.map((file) => {
                const isSelected = selectedFile === file.path;
                const isMain = file.path === entrypoint;

                return (
                  <div
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    className={`p-2.5 rounded-xs border cursor-pointer transition-all flex items-center justify-between text-left ${
                      isSelected
                        ? "bg-[#14120e] border-[#A1824A] text-stone-100"
                        : "bg-[#0c0c0c] border-[#1d1d1d] hover:border-stone-700 hover:bg-[#111]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isMain ? "text-[#A1824A]" : "text-gray-500"}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-mono font-medium truncate">{file.path}</span>
                        <span className="text-[9px] font-mono text-gray-500 leading-none flex items-center gap-1">
                          {file.language ? (
                            <span className="text-emerald-500/80">{LANG_LABEL[file.language]}</span>
                          ) : (
                            <span>기타</span>
                          )}
                          <span>· {(file.size / 1024).toFixed(1)} KB</span>
                        </span>
                      </div>
                    </div>

                    {isMain && (
                      <span className="text-[8px] font-mono text-white bg-[#A1824A] px-1 py-0.5 rounded-xs shrink-0">
                        ENTRY
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Real repository statistics */}
            <div className="bg-[#14120e]/35 border border-[#A1824A]/20 p-3 rounded-xs text-[10px] leading-relaxed text-stone-400">
              <div className="flex items-center gap-1.5 text-[#A1824A] font-bold mb-1 font-mono">
                <Braces className="w-3.5 h-3.5" />
                <span>REAL REPO STATS</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-[#111] p-1.5 rounded-xs border border-[#222]">
                  <span className="text-gray-500 text-[8px] block">Total Files</span>
                  <strong className="text-stone-300 font-mono">{files.length}</strong>
                </div>
                <div className="bg-[#111] p-1.5 rounded-xs border border-[#222]">
                  <span className="text-[#A1824A] text-[8px] block">Source Files</span>
                  <strong className="text-emerald-400 font-mono">{sourceFileCount}</strong>
                </div>
                <div className="bg-[#111] p-1.5 rounded-xs border border-[#222]">
                  <span className="text-gray-500 text-[8px] block">Total Size</span>
                  <strong className="text-stone-300 font-mono">{(totalBytes / 1024).toFixed(0)} KB</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Viewer (Right) */}
          <div className="lg:col-span-8 border border-[#222] bg-[#0c0c0c] rounded-xs flex flex-col justify-between min-h-[300px]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#222] bg-[#0c0c0c]/90">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-[#A1824A] shrink-0" />
                <span className="text-[11px] font-mono font-bold text-stone-300 truncate">
                  {selectedFile}
                </span>
              </div>

              {selectedLanguage && (
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded-xs border border-emerald-900/60 shrink-0 uppercase">
                  {LANG_LABEL[selectedLanguage]}
                </span>
              )}
            </div>

            {/* Code view box */}
            <div className="flex-1 p-3 bg-[#080808] text-stone-400 font-mono text-[10.5px] leading-relaxed overflow-auto max-h-[280px] relative">
              {isLoadingFile ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
                  <Loader2 className="w-5 h-5 text-[#A1824A] animate-spin" />
                  <span className="text-[10px]">Loading real source content...</span>
                </div>
              ) : (
                <pre className="whitespace-pre">
                  {fileContent || "// 이 파일의 내용을 읽는 중입니다."}
                </pre>
              )}
            </div>

            {/* Inflow deployment CTA trigger */}
            <div className="p-3 border-t border-[#1a1a1a] bg-[#14120e] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-stone-400 text-[10.5px] leading-relaxed text-left">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  선택한 실제 소스 파일을 코어 분석 워크벤치로 주입하여 CFG 정적 분석을 기동하시겠습니까?
                </span>
              </div>
              <button
                onClick={handleInjectToWorkspace}
                disabled={!selectedEntry || isInjecting}
                className="w-full sm:w-auto px-4 py-1.5 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white text-[11px] font-bold rounded-xs cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm disabled:opacity-50"
              >
                {isInjecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>검증 통합 워크벤치 기동</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan error state */}
      {!isScanning && hasScanned && scanError && (
        <div className="border border-[#ef4444]/30 bg-[#ef4444]/5 rounded-sm p-6 text-center flex flex-col items-center justify-center gap-2.5 mt-2">
          <AlertCircle className="w-6 h-6 text-[#ef4444]" />
          <span className="text-[11px] font-bold text-stone-300">리포지토리 스캔 실패</span>
          <span className="text-[10px] text-red-400/80 font-mono max-w-[520px] break-words">{scanError}</span>
          <button
            onClick={() => setScanError(null)}
            className="mt-1 flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-stone-300 bg-[#111] border border-[#333] rounded-xs cursor-pointer hover:border-[#A1824A]/40"
          >
            <RefreshCcw className="w-3 h-3" />
            URL 수정 후 다시 시도
          </button>
        </div>
      )}

      {/* Guide message if not scanned yet */}
      {!isScanning && !hasScanned && (
        <div className="border border-dashed border-stone-800 bg-[#080808]/30 rounded-sm p-8 text-center flex flex-col items-center justify-center gap-2.5 mt-2">
          <Network className="w-7 h-7 text-gray-600 animate-pulse" />
          <div className="max-w-[460px]">
            <span className="text-[11px] font-bold text-stone-400 block mb-0.5">
              Git 저장소 URL을 입력하고 실제 소스 파일을 선택하십시오
            </span>
            <span className="text-[10px] text-gray-500 leading-normal block">
              서버가 리포지토리를 <strong>shallow-clone</strong> 하여 소스 트리를 구성합니다.
              이후 파일을 선택하면 확장자 기반 언어 자동 판별 후 분석 워크벤치로 주입됩니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
