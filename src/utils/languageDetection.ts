import { SupportedLanguage } from "../types";

// 확장자 기반 지원 언어 자동 판별 매핑
const EXTENSION_MAP: Record<string, SupportedLanguage> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "javascript",
  tsx: "javascript",
  py: "python",
  python: "python",
  java: "java",
  c: "cpp",
  cc: "cpp",
  cpp: "cpp",
  cxx: "cpp",
  h: "cpp",
  hh: "cpp",
  hpp: "cpp",
  hxx: "cpp",
};

const SUPPORTED_EXTENSIONS = Object.keys(EXTENSION_MAP).map((e) => `.${e}`);

export function detectLanguageFromFileName(fileName: string): SupportedLanguage | null {
  const dotIdx = fileName.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const ext = fileName.slice(dotIdx + 1).toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}

export function supportedExtensionsLabel(): string {
  return SUPPORTED_EXTENSIONS.join(", ");
}
