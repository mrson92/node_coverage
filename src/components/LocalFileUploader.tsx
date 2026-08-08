import React, { useState, useRef } from "react";
import { UploadCloud, FileCode, FileUp, AlertCircle, CheckCircle2, X } from "lucide-react";
import { SupportedLanguage } from "../types";
import {
  detectLanguageFromFileName,
  supportedExtensionsLabel,
} from "../utils/languageDetection";

interface LocalFileUploaderProps {
  onFileLoaded: (language: SupportedLanguage, fileName: string, code: string) => void;
}

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB 안전 상한

const LANG_LABEL: Record<SupportedLanguage, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C/C++",
};

export function LocalFileUploader({ onFileLoaded }: LocalFileUploaderProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(`파일 크기가 2MB를 초과합니다 (현재 ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    const lang = detectLanguageFromFileName(file.name);
    if (!lang) {
      setError(`지원되지 않는 확장자입니다. 지원 확장자: ${supportedExtensionsLabel()}`);
      return;
    }
    try {
      const code = await file.text();
      setFileName(file.name);
      setDetectedLanguage(lang);
      onFileLoaded(lang, file.name, code);
    } catch (err) {
      setError("파일을 읽어들이지 못했습니다. 인코딩 또는 권한을 확인해 주세요.");
    }
  };

  const handleFilesPicked = (files: FileList | null) => {
    const file = files?.[0];
    if (file) handleFile(file);
  };

  const resetSelection = () => {
    setFileName(null);
    setDetectedLanguage(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      id="local-file-dropzone"
      role="button"
      tabIndex={0}
      aria-label="로컬 소스 파일 선택 또는 드래그앤드롭"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFilesPicked(e.dataTransfer.files);
      }}
      className={`relative cursor-pointer rounded-xs border border-dashed transition-all ${
        isDragging
          ? "border-[#A1824A] bg-[#A1824A]/10"
          : "border-[#2c2c2c] bg-[#080808]/60 hover:border-[#A1824A]/40 hover:bg-[#0c0c0c]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={supportedExtensionsLabel()}
        className="hidden"
        onChange={(e) => {
          handleFilesPicked(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="p-3 flex flex-col gap-1.5 select-none">
        {fileName ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-mono text-stone-200 truncate">{fileName}</span>
              {detectedLanguage && (
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded-xs border border-emerald-900/60 uppercase shrink-0">
                  {LANG_LABEL[detectedLanguage]}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSelection();
                }}
                aria-label="선택 파일 해제"
                className="ml-auto p-0.5 text-gray-500 hover:text-rose-400 rounded-xs shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-emerald-500/90 font-sans flex items-center gap-1">
              <FileUp className="w-3 h-3" />
              로컬 소스를 워크벤치에 로드했습니다. 파일을 다시 선택/드롭하여 교체할 수 있습니다.
            </p>
          </>
        ) : error ? (
          <>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px] text-rose-300 font-sans">파일 로드 실패</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetSelection();
                }}
                className="ml-auto p-0.5 text-gray-500 hover:text-stone-300 rounded-xs shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-rose-400/80 font-mono leading-normal break-words">{error}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <UploadCloud className={`w-3.5 h-3.5 shrink-0 ${isDragging ? "text-[#A1824A]" : "text-gray-500"}`} />
              <span className="text-[11px] font-bold text-stone-300">
                로컬 소스 파일 선택 / 드래그앤드롭
              </span>
            </div>
            <p className="text-[9.5px] text-gray-500 font-mono leading-relaxed">
              확장자 자동 판별 후 분석기로 미리 로드됩니다. ({supportedExtensionsLabel()})
            </p>
          </>
        )}
      </div>
      {!fileName && !error && (
        <span className="absolute top-2 right-2 p-1 bg-[#111] border border-[#222] rounded-xs text-[#A1824A]">
          <FileCode className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}