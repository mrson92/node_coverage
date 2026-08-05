import React, { useState, useMemo } from "react";
import { SupportedLanguage, AnalysisResults } from "../types";
import { 
  History, 
  Trash2, 
  X, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Plus, 
  FileCode, 
  Calendar, 
  Settings, 
  Sparkles, 
  HelpCircle,
  Clock,
  ExternalLink,
  Code2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface AnalysisSession {
  id: string;
  title: string;
  timestamp: string;
  language: SupportedLanguage;
  code: string;
  requirements: string;
  analysisResults: AnalysisResults;
  coveragePercent: number;
  complexity: number;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AnalysisSession[];
  onLoadSession: (session: AnalysisSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  currentCode: string;
  currentRequirements: string;
  currentLanguage: SupportedLanguage;
  currentResults: AnalysisResults | null;
  onSaveCurrentSession: (title?: string) => void;
}

export function HistorySidebar({
  isOpen,
  onClose,
  sessions,
  onLoadSession,
  onDeleteSession,
  onClearAllSessions,
  currentCode,
  currentRequirements,
  currentLanguage,
  currentResults,
  onSaveCurrentSession,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [comparingSession, setComparingSession] = useState<AnalysisSession | null>(null);

  // Filtered session list based on search/language query
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const query = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(query) ||
        s.language.toLowerCase().includes(query) ||
        s.requirements.toLowerCase().includes(query)
      );
    });
  }, [sessions, searchQuery]);

  // Calculations for current workspace metrics to compare against
  const currentNC = useMemo(() => {
    if (!currentResults) return 0;
    const total = currentResults.nodes.length;
    const covered = currentResults.nodes.filter((n) => n.isCovered).length;
    return total > 0 ? Math.round((covered / total) * 100) : 0;
  }, [currentResults]);

  const currentComplexity = currentResults?.complexity.cyclomaticComplexity || 0;

  const handleSave = () => {
    onSaveCurrentSession(customTitle.trim() || undefined);
    setCustomTitle("");
    setShowSaveDialog(false);
  };

  return (
    <>
      {/* 1. Sidebar Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile overlays */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />

            <motion.div
              id="session-history-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#0c0c0c] border-r border-[#222] z-50 flex flex-col justify-between shadow-2xl h-screen outline-hidden"
            >
              {/* Header section */}
              <div className="p-4 border-b border-[#222] bg-[#080808]/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#A1824A]" />
                  <span className="text-xs font-sans tracking-widest text-[#A1824A] uppercase font-bold">
                    Analysis Runs History
                  </span>
                  <span className="text-[10px] bg-[#111] px-1.5 py-0.2 rounded-xs border border-[#222] font-mono text-gray-400 font-bold">
                    {sessions.length}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-stone-300 rounded-xs hover:bg-[#111] transition-all cursor-pointer"
                  id="close-history-sidebar-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main functional toolbars when open */}
              <div className="p-4 border-b border-[#111] bg-[#0c0c0c] flex flex-col gap-2">
                {/* Search bar */}
                <input
                  type="text"
                  placeholder="런 이름, 언어, 요건 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-[#080808] border border-[#222] text-stone-200 rounded-sm py-1.5 px-3 outline-hidden transition-all focus:border-[#A1824A]/50 placeholder-gray-600 font-sans"
                />

                {/* Save active button */}
                <button
                  id="save-session-btn"
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#A1824A]/10 hover:bg-[#A1824A]/15 text-[#A1824A] text-[11px] font-bold rounded-xs border border-[#A1824A]/20 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>현재 상태 책갈피/북마크 저장</span>
                </button>
              </div>

              {/* Live Session List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                {showSaveDialog && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-[#111] border border-[#A1824A]/30 rounded-xs flex flex-col gap-2 mb-2"
                  >
                    <span className="text-[10px] font-sans font-semibold text-[#A1824A] uppercase tracking-wider block">
                      Custom Session Name
                    </span>
                    <input
                      type="text"
                      placeholder="예시: 리팩토링 후 주문 트랜잭션"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full text-xs bg-[#080808] border border-[#222] text-stone-200 rounded-xs py-1 px-2.5 outline-hidden focus:border-[#A1824A]/40"
                    />
                    <div className="flex justify-end gap-2 text-[10px]">
                      <button
                        onClick={() => setShowSaveDialog(false)}
                        className="px-2 py-1 text-gray-500 hover:text-stone-300 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-2.5 py-1 bg-[#A1824A] text-white font-bold rounded-xs transition-colors"
                      >
                        저장
                      </button>
                    </div>
                  </motion.div>
                )}

                {filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-stone-600 border border-dashed border-[#222] rounded-xs p-4 h-full">
                    <History className="w-8 h-8 text-stone-800 mb-2 stroke-[1.5px]" />
                    <p className="text-[11px] font-sans">
                      {searchQuery ? "검색 조건과 일치하는 분석 이력이 없습니다." : "아직 기록된 세션 분석이 없습니다. 코드를 실행하거나 수동으로 상태를 저장하십시오."}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isActive = currentCode === session.code && currentLanguage === session.language;

                    return (
                      <div
                        key={session.id}
                        className={`p-3.5 rounded-xs border transition-all flex flex-col justify-between ${
                          isActive
                            ? "bg-[#111111] border-[#A1824A]/40 text-stone-200"
                            : "bg-[#080808]/40 border-[#222] text-gray-400 hover:border-stone-800"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-[11px] font-semibold text-stone-200 truncate pr-1" title={session.title}>
                            {session.title}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 shrink-0 uppercase tracking-widest bg-[#0c0c0c] border border-[#212121] px-1.5 py-0.2 rounded-xs">
                            {session.language}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-500 font-mono truncate mb-2 leading-relaxed">
                          {session.requirements || "요건 명세가 없습니다."}
                        </p>

                        <div className="grid grid-cols-2 gap-1 text-[10px] bg-[#0c0c0c]/85 border border-[#1a1a1a] p-1.5 rounded-xs mb-3 font-mono">
                          <div>
                            <span className="text-gray-500 block text-[9px] uppercase">Node Coverage</span>
                            <span className="text-[#A1824A] font-bold">{session.coveragePercent}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[9px] uppercase">Complexity</span>
                            <span className="text-[#A1824A] font-bold">{session.complexity} CC</span>
                          </div>
                        </div>

                        {/* Actions for each item */}
                        <div className="flex justify-between items-center gap-1">
                          <button
                            id={`load-history-${session.id}`}
                            onClick={() => onLoadSession(session)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-[#A1824A] text-[10px] font-bold rounded-xs cursor-pointer transition-colors"
                          >
                            <Clock className="w-3 h-3 text-[#A1824A]" />
                            <span>{isActive ? "현재 활성화" : "불러오기"}</span>
                          </button>

                          <button
                            id={`compare-history-${session.id}`}
                            onClick={() => setComparingSession(session)}
                            className="p-1 px-2 bg-[#111] hover:bg-[#1c140d] border border-[#222] text-stone-300 hover:text-[#A1824A] rounded-xs cursor-pointer transition-all"
                            title="실시간 워크스페이스 상태와 상세 비교"
                          >
                            <ArrowLeftRight className="w-3 h-3 text-[#A1824A]" />
                          </button>

                          <button
                            id={`delete-history-${session.id}`}
                            onClick={() => onDeleteSession(session.id)}
                            className="p-1 bg-[#111] hover:bg-rose-950/20 border border-[#222] hover:border-rose-950 text-stone-500 hover:text-rose-400 rounded-xs cursor-pointer transition-colors"
                            title="세션 영구 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Clear all bottom drawer button */}
              {sessions.length > 0 && (
                <div className="p-4 border-t border-[#1a1a1a] bg-[#080808]/90">
                  <button
                    id="clear-all-sessions-btn"
                    onClick={() => {
                      if (confirm("정격 저장된 모든 세션 이력을 복구 불가하게 완전 영구 소멸시키겠습니까?")) {
                        onClearAllSessions();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#181111] hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-[#2d1b1b] rounded-xs text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>모든 분석 세션 이력 전체 일괄 삭제</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Side-by-Side Verification Comparative Modal Overlay */}
      <AnimatePresence>
        {comparingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0c] border border-[#222] w-full max-w-4xl max-h-[85vh] flex flex-col justify-between rounded-sm overflow-hidden shadow-2xl"
              id="comparison-modal"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#080808]">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#A1824A]" />
                  <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-widest">
                    Run Core Comparison Matrix
                  </h3>
                </div>
                <button
                  onClick={() => setComparingSession(null)}
                  className="p-1 text-gray-500 hover:text-stone-300 hover:bg-[#111] rounded-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal scrollable body comparison columns */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 scrollbar-thin">
                {/* Visual scorecard metrics comparison details info block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Metric NC */}
                  <div className="border border-[#222] bg-[#080808]/40 p-4 rounded-sm flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono text-gray-500">Node Coverage %</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <div className="text-xs">
                        <span className="text-gray-500 block">Workspace</span>
                        <strong className="text-white text-lg font-mono">{currentNC}%</strong>
                      </div>
                      <span className="text-[#A1824A] text-lg font-serif">vs</span>
                      <div className="text-xs text-right">
                        <span className="text-gray-500 block">{comparingSession.title}</span>
                        <strong className="text-[#A1824A] text-lg font-mono">{comparingSession.coveragePercent}%</strong>
                      </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="mt-3 leading-normal border-t border-[#111] pt-2 text-[10px] text-stone-400">
                      {currentNC > comparingSession.coveragePercent ? (
                        <span className="text-emerald-400 font-bold">▲ Workspace is {currentNC - comparingSession.coveragePercent}% Higher</span>
                      ) : currentNC < comparingSession.coveragePercent ? (
                        <span className="text-amber-500 font-bold">▼ Workspace is {comparingSession.coveragePercent - currentNC}% Lower</span>
                      ) : (
                        <span className="text-stone-500 font-bold">● Equivalent Node coverage levels</span>
                      )}
                    </div>
                  </div>

                  {/* Metric Complexity */}
                  <div className="border border-[#222] bg-[#080808]/40 p-4 rounded-sm flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono text-gray-500">Cyclomatic Complexity</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <div className="text-xs">
                        <span className="text-gray-500 block">Workspace</span>
                        <strong className="text-white text-lg font-mono">{currentComplexity}</strong>
                      </div>
                      <span className="text-[#A1824A] text-lg font-serif">vs</span>
                      <div className="text-xs text-right">
                        <span className="text-gray-500 block">{comparingSession.title}</span>
                        <strong className="text-[#A1824A] text-lg font-mono">{comparingSession.complexity}</strong>
                      </div>
                    </div>
                    <div className="mt-3 leading-normal border-t border-[#111] pt-2 text-[10px] text-stone-400">
                      {currentComplexity < comparingSession.complexity ? (
                        <span className="text-emerald-400 font-bold">▲ Workspace offers {comparingSession.complexity - currentComplexity} simplified paths</span>
                      ) : currentComplexity > comparingSession.complexity ? (
                        <span className="text-amber-500 font-bold">▼ Complexity increased by {currentComplexity - comparingSession.complexity} paths</span>
                      ) : (
                        <span className="text-stone-500 font-bold">● Matching cyclomatic complexity metrics</span>
                      )}
                    </div>
                  </div>

                  {/* General Info */}
                  <div className="border border-[#222] bg-[#080808]/40 p-4 rounded-sm flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono text-gray-500">Language & Spec Summary</span>
                    <div className="flex mt-2 justify-between items-center text-xs">
                      <div>
                        <span className="text-gray-500 block">Workspace</span>
                        <strong className="text-white uppercase font-mono">{currentLanguage}</strong>
                      </div>
                      <span className="text-stone-700">|</span>
                      <div className="text-right">
                        <span className="text-gray-500 block">{comparingSession.title}</span>
                        <strong className="text-[#A1824A] uppercase font-mono">{comparingSession.language}</strong>
                      </div>
                    </div>
                    <div className="mt-3 leading-normal border-t border-[#111] pt-2 text-[10px] text-stone-400 truncate">
                      <Calendar className="w-3 h-3 text-[#A1824A] inline mr-1" />
                      <span>{comparingSession.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Side-by-side spec comparison details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* System specification requirements */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-sans font-bold text-gray-400 tracking-wider">
                      Workspace Requirements Spec
                    </span>
                    <div className="bg-[#080808] border border-[#222] p-3 rounded-xs text-xs font-mono text-stone-300 h-28 overflow-y-auto leading-relaxed">
                      {currentRequirements || "(No requirements defined in workspace)"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-sans font-bold text-[#A1824A] tracking-wider">
                      {comparingSession.title} Requirements Spec
                    </span>
                    <div className="bg-[#080808] border border-[#222] p-3 rounded-xs text-xs font-mono text-[#A1824A] h-28 overflow-y-auto leading-relaxed">
                      {comparingSession.requirements || "(No requirements defined in session)"}
                    </div>
                  </div>
                </div>

                {/* Code-body delta block visualization */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] uppercase font-sans font-bold text-gray-400 tracking-wider">
                      Code Implementation Comparisons
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Line Stats: Workspace ({currentCode.split("\n").length} lines) vs Session ({comparingSession.code.split("\n").length} lines)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-gray-500 font-mono bg-[#111] px-2 py-0.5 self-start rounded-xs border border-[#222]">
                        Active Workspace Code
                      </span>
                      <pre className="bg-[#080808] border border-[#222] p-4 rounded-xs text-xs font-mono text-[#cccccc] h-64 overflow-auto whitespace-pre-wrap leading-relaxed select-all">
                        {currentCode}
                      </pre>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-[#A1824A] font-mono bg-[#1c140d] px-2 py-0.5 self-start rounded-xs border border-[#222]">
                        Past Run [{comparingSession.title}] Code
                      </span>
                      <pre className="bg-[#080808] border border-[#222] p-4 rounded-xs text-xs font-mono text-amber-500/80 h-64 overflow-auto whitespace-pre-wrap leading-relaxed select-all">
                        {comparingSession.code}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer controls */}
              <div className="p-4 border-t border-[#222] bg-[#080808] flex justify-end gap-2.5">
                <button
                  onClick={() => setComparingSession(null)}
                  className="px-4 py-2 text-xs border border-[#222] bg-[#111] hover:bg-[#1a1a1a] text-stone-300 rounded-sm cursor-pointer transition-colors"
                >
                  비교창 닫기 (Close)
                </button>
                <button
                  onClick={() => {
                    onLoadSession(comparingSession);
                    setComparingSession(null);
                  }}
                  className="px-4 py-2 text-xs bg-[#A1824A] hover:bg-[#A1824A]/90 text-white font-bold rounded-sm cursor-pointer transition-colors"
                >
                  이 세션 세분화 복원 적용 (Restore Run)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
