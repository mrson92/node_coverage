import { useState } from "react";
import { SupportedLanguage } from "./types";
import { useAnalysisEngine } from "./hooks/useAnalysisEngine";
import { MetricCard } from "./components/MetricCard";
import { CFGVisualizer } from "./components/CFGVisualizer";
import { RTMViewer } from "./components/RTMViewer";
import { CoverageSimulator } from "./components/CoverageSimulator";
import { TimeSeriesStats } from "./components/TimeSeriesStats";
import { AgenticOptimizer } from "./components/AgenticOptimizer";
import { HistorySidebar } from "./components/HistorySidebar";
import { WorkflowHUD } from "./components/WorkflowHUD";
import { IntegrationConsultant } from "./components/IntegrationConsultant";
import { MultiFileGitAnalyzer } from "./components/MultiFileGitAnalyzer";
import { LocalFileUploader } from "./components/LocalFileUploader";
import { AuthScreen } from "./components/AuthScreen";

import {
  Network,
  Settings,
  Cpu,
  Code2,
  Terminal,
  Clock,
  CheckCircle,
  ShieldAlert,
  RefreshCcw,
  History,
  LogOut,
} from "lucide-react";

export default function App() {
  // 0. Auth gate state (demo, localStorage-backed)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem("node-coverage-auth") === "1" ||
      sessionStorage.getItem("node-coverage-auth") === "1"
    );
  });

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem("node-coverage-auth");
    sessionStorage.removeItem("node-coverage-auth");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <AppDashboard onLogout={handleLogout} />;
}

function AppDashboard({ onLogout }: { onLogout: () => void }) {
  // 1. Dedicated analysis engine hook (state + simulation + sessions + API calls)
  const engine = useAnalysisEngine();
  const {
    // 상태
    selectedLanguage,
    setSelectedLanguage,
    requirements,
    setRequirements,
    code,
    setCode,
    analysisResults,
    selectedNodeId,
    isAnalyzing,
    isOptimizing,
    optimizationResult,
    sessions,
    isSidebarOpen,
    setIsSidebarOpen,
    manualWorkflowStep,
    setManualWorkflowStep,
    utcNow,
    stats,
    activeSelectedNode,
    // 핸들러
    handleExternalSource,
    handleAnalyzeCode,
    handleRunAgentOptimization,
    handleSimulateNodeExecution,
    handleResetCoverage,
    handleRunFullTestSuite,
    handleSelectNode,
    handleLoadSession,
    handleDeleteSession,
    handleClearAllSessions,
    handleSaveCurrentSession,
  } = engine;

  return (
    <div className="min-h-screen bg-[#080808] text-[#cccccc] flex flex-col font-sans selection:bg-[#A1824A]/30 selection:text-white">

      {/* 1. Header component */}
      <header className="border-b border-[#111111] bg-[#0c0c0c]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        {/* Title area */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-sm bg-[#A1824A]/10 text-[#A1824A] border border-[#A1824A]/25 shadow-md shadow-black/40">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-serif italic tracking-tight text-[#A1824A] leading-none">
                Node Coverage Analyzer
              </span>
              <span className="bg-emerald-950/25 text-emerald-400 text-[9px] px-2 py-0.5 rounded-xs border border-emerald-900/35 font-mono flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink" />
                ACTIVE ENGINE
              </span>
            </div>
            <h1 className="text-[10px] text-gray-500 mt-1 font-sans tracking-wide">
              제품 전 생애주기 통합형 프로그래밍 언어 다변화 노드 커버리지 분석 대시보드
            </h1>
          </div>
        </div>

        {/* Global info controls */}
        <div className="flex items-center gap-3 self-stretch md:self-auto font-mono text-[11px] text-gray-400">
          <button
            id="toggle-history-sidebar-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-[#222]/80 hover:border-[#A1824A]/40 text-[#A1824A] text-[11px] font-sans font-bold rounded-xs cursor-pointer transition-all"
          >
            <History className="w-4 h-4 text-[#A1824A]" />
            <span>분석 이력 히스토리 ({sessions.length})</span>
          </button>

          <button
            id="logout-btn"
            onClick={onLogout}
            title="로그아웃"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-[#222]/80 hover:border-[#A1824A]/40 text-gray-400 text-[11px] font-sans font-bold rounded-xs cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4 text-[#A1824A]" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-[#222]/80 rounded-xs">
            <Clock className="w-4 h-4 text-[#A1824A]" />
            <span>UTC Clock: {utcNow}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-[#222]/80 rounded-xs">
            <Cpu className="w-4 h-4 text-[#A1824A]" />
            <span>Core v4.2 (Docker)</span>
          </div>
        </div>

      </header>

      {/* 2. Main Dashboard panel */}
      <main className="flex-1 px-6 py-8 flex flex-col gap-8 max-w-[1700px] w-full mx-auto">

        {/* Workflow HUD Component */}
        <WorkflowHUD
          currentStep={manualWorkflowStep}
          onStepClick={(stepIndex) => setManualWorkflowStep(stepIndex)}
          analysisResultsPresent={!!analysisResults}
          simulationTriggered={analysisResults?.nodes.some((n) => n.executionCount > 0) || false}
          optimizerTriggered={!!optimizationResult || isOptimizing}
        />

        {/* Section: Multi-File & Remote Git Analyzer with AST Skeleton Parser */}
        <section className="flex flex-col gap-2">
          <MultiFileGitAnalyzer
            currentLanguage={selectedLanguage}
            onLoadResolvedCode={handleExternalSource}
          />
        </section>

        {/* Section A: Selection Toolbar and Code Editor Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel: Code controller & NLP Specifications */}
          <div className="lg:col-span-1 border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-6 flex flex-col justify-between h-[510px]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#111]">
                <h2 className="text-xs font-sans tracking-widest text-[#A1824A] uppercase font-bold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#A1824A]" />
                  <span>Config Workspace & Parser</span>
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Config</span>
                </div>
              </div>

              {/* Template selection dropdown */}
              <div className="mb-4">
                <label className="text-[10px] uppercase font-sans font-semibold text-gray-500 tracking-wider block mb-1.5">
                  Target Programming Scenario
                </label>
                <div className="relative">
                  <select
                    id="language-scenario-selector"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                    className="w-full text-xs bg-[#080808] hover:bg-[#111] border border-[#222] text-stone-200 rounded-sm py-2 px-3 cursor-pointer outline-hidden transition-all font-sans font-medium focus:border-[#A1824A]/50"
                  >
                    <option value="javascript">비동기 주문 트랜잭션 (JavaScript)</option>
                    <option value="java">다형성 요요 상속 훅 (Java)</option>
                    <option value="cpp">포인터 간접 참조 및 매크로 (C/C++)</option>
                    <option value="python">동적 타이핑 가변 데이터 (Python)</option>
                  </select>
                </div>
              </div>

              {/* NLP Requirements specification text input area */}
              <div className="mb-4">
                <label className="text-[10px] uppercase font-sans font-semibold text-gray-500 tracking-wider block mb-1.5">
                  NLP System Requirements Specification (RTM)
                </label>
                <textarea
                  id="requirements-input"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="정적/동적 매핑을 위한 명세 요건들을 입력하십시오."
                  className="w-full h-[120px] text-xs bg-[#080808] text-stone-300 font-mono rounded-sm p-3 border border-[#222] outline-hidden focus:border-[#A1824A]/50 resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Target Code input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] uppercase font-sans font-semibold text-gray-500 tracking-wider block">
                    Source Code
                  </label>
                  <span className="text-[9px] font-mono select-none px-1.5 py-0.2 rounded-xs bg-[#080808] text-[#A1824A] border border-[#222] uppercase font-bold">
                    {selectedLanguage}
                  </span>
                </div>
                <div className="bg-[#080808] rounded-sm border border-[#222]/80 p-3 text-[10px] text-gray-500 font-mono line-clamp-2 h-[50px] overflow-hidden leading-normal select-none">
                  Editable in real-time. Codebody automatically updates CFG structures based on parsing logic.
                </div>
              </div>
            </div>

            {/* Run core analyze button */}
            <div className="pt-3 border-t border-[#111]">
              <button
                id="analyse-code-btn"
                onClick={handleAnalyzeCode}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#A1824A] hover:bg-[#A1824A]/95 text-white text-xs font-bold rounded-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 border border-[#A1824A]/10"
              >
                {isAnalyzing ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Code2 className="w-3.5 h-3.5 pointer-events-none" />
                )}
                <span>{isAnalyzing ? "코드 의미 파싱 분석 중..." : "NLP 요건 기반 소스 코드 AI 분석 실행"}</span>
              </button>
            </div>

          </div>

          {/* Right panel: Static Code viewer input */}
          <div className="lg:col-span-2 border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-6 flex flex-col justify-between h-[510px]">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 border-b border-[#111] pb-2">
                <span className="text-xs font-sans font-bold text-[#A1824A] flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#A1824A]" />
                  <span>Active Source Editor Block</span>
                </span>
                <span className="text-[10px] text-gray-500 font-sans">
                  직접 수정 후 수동 파싱을 가동하여 커버리지 노드를 증분 생성하십시오
                </span>
              </div>
              <div className="shrink-0 pb-3">
                <LocalFileUploader
                  onFileLoaded={(lang, fileName, fileCode) =>
                    handleExternalSource(
                      lang,
                      fileCode,
                      `분석할 로컬 소스 파일: ${fileName}\n\n` +
                        `소스 코드를 분석하여 진입점(Entry) 흐름의 기능 요건을 작성하십시오.\n` +
                        `제어 흐름, 오류 처리, 보안 관련 경로를 기준으로 RTM 요건을 도출하십시오.`
                    )
                  }
                />
              </div>
              <textarea
                id="source-code-editor"
                className="flex-1 w-full bg-[#080808] text-stone-200 font-mono text-xs leading-relaxed p-4 rounded-sm outline-hidden border border-[#222] transition-colors focus:border-[#A1824A]/40 resize-none overflow-auto"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="코드를 이곳에 붙여넣으십시오."
              />
            </div>
          </div>

        </section>

        {/* Section B: Dynamic Performance metrics deck */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            id="node-coverage"
            title="노드 커버리지 NC (Statement)"
            value={`${stats.nc}%`}
            subValue={`${analysisResults?.nodes.filter((n) => n.isCovered).length || 0}/${stats.totalNodes} Nodes`}
            changeRate={stats.nc > 0 ? { direction: "up", value: "실시간 감지 가동" } : undefined}
            icon={CheckCircle}
            themeColor="emerald"
            badgeText={stats.nc >= 80 ? "안정" : "경보"}
            description="CFG의 모든 실행 대상 도달 가능한 노드를 실행 보장한 정량 비율입니다."
          />
          <MetricCard
            id="edge-coverage"
            title="에지 커버리지 EC (Branch)"
            value={`${stats.ec}%`}
            subValue="분기 시그널 묶음"
            icon={Network}
            themeColor="indigo"
            description="CFG 내부에서 True/False 브랜치 분산 결정을 타격한 관계수치입니다."
          />
          <MetricCard
            id="complexity"
            title="순환 복잡도 Cyclomatic"
            value={stats.complexity}
            subValue="Linear Paths"
            icon={Terminal}
            themeColor="amber"
            description="McCabe 지표를 준용하여 도출한 경로 분기 간접 영역 한계 수치입니다."
          />
          <MetricCard
            id="failure-rate"
            title="소프트웨어 기술 부채 지수"
            value={`${stats.debt.toFixed(1)} dS`}
            subValue={`세션 ${sessions.length}개 평균 대비 ${stats.debtDelta >= 0 ? "+" : ""}${stats.debtDelta.toFixed(1)} dS`}
            icon={ShieldAlert}
            themeColor="rose"
            badgeText={stats.debt < 3 ? "안정 유지 중" : stats.debt < 6 ? "주시 필요" : "경고 임박"}
            description="미커버 노드 비율과 순환 복잡도를 실측 역산한 품질 부채 지수입니다."
          />
        </section>

        {/* Section C: CFG Interactive Graph & Selected Node metadata sheets */}
        <section className="flex flex-col gap-2" id="cfg-section">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase font-sans font-bold tracking-[0.14em] text-[#A1824A]">
              Control Flow Graph Design Matrix
            </h2>
          </div>
          {analysisResults && (
            <CFGVisualizer
              nodes={analysisResults.nodes}
              edges={analysisResults.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onSimulateNodeExecution={handleSimulateNodeExecution}
              language={selectedLanguage}
              code={code}
            />
          )}
        </section>

        {/* Section D: Coverage Code-line Simulation Sandbox */}
        <section className="flex flex-col gap-2" id="simulation-section">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase font-sans font-bold tracking-[0.14em] text-[#A1824A]">
              Interactive Coverage Simulator Sandbox
            </h2>
          </div>
          {analysisResults && (
            <CoverageSimulator
              code={code}
              nodes={analysisResults.nodes}
              onSimulateNodeExecution={handleSimulateNodeExecution}
              onResetCoverage={handleResetCoverage}
              onRunFullSuite={handleRunFullTestSuite}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          )}
        </section>

        {/* Section E: NLP Traceability check (RTM) */}
        <section className="flex flex-col gap-2">
          {analysisResults && (
            <RTMViewer
              rtm={analysisResults.rtm}
              nodes={analysisResults.nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          )}
        </section>

        {/* Section F: Agentic Coverage Optimizer AI Panel */}
        <section className="flex flex-col gap-2" id="ai-optimizer-section">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase font-sans font-bold tracking-[0.14em] text-[#A1824A]">
              AI Agent Coverage Constraint Optimization
            </h2>
          </div>
          <AgenticOptimizer
            selectedNode={activeSelectedNode}
            code={code}
            language={selectedLanguage}
            isOptimizing={isOptimizing}
            onRunOptimization={handleRunAgentOptimization}
            optimizationResult={optimizationResult}
          />
        </section>

        {/* Section G: Automated Integration Consultant Workspace */}
        <section className="flex flex-col gap-2" id="integration-consultant-section">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase font-sans font-bold tracking-[0.14em] text-[#A1824A]">
              EASE-OF-USE DESIGN WORKFLOW CONSULTANT
            </h2>
          </div>
          <IntegrationConsultant />
        </section>

        {/* Section H: Time Series Erosion Charts & technical debt alerts */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase font-sans font-bold tracking-[0.14em] text-[#A1824A]">
              Lifecycle Erosion & Software Churn Analysis
            </h2>
          </div>
          <TimeSeriesStats
            sessions={sessions}
            currentResults={analysisResults}
          />
        </section>

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#111111] bg-[#050505] px-6 py-6 text-center text-xs text-gray-500 font-sans">
        <p>© 2026 Node Coverage Analyzer. Engineered to trigger optimal SDLC integration quality gates.</p>
      </footer>

      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        currentCode={code}
        currentRequirements={requirements}
        currentLanguage={selectedLanguage}
        currentResults={analysisResults}
        onSaveCurrentSession={handleSaveCurrentSession}
      />

    </div>
  );
}