import React, { useState, useEffect } from "react";
import { SupportedLanguage, AnalysisResults, CFGNode, OptimizationResult, BatchSourceFile } from "../types";
import { TEMPLATES } from "../data/mockTemplates";
import { FALLBACK_RESULTS } from "../data/fallbackResults";
import { AnalysisSession } from "../components/HistorySidebar";

export interface DashboardStats {
  nc: number;
  ec: number;
  complexity: number;
  totalNodes: number;
  totalEdges: number;
  debt: number;
  debtDelta: number;
}

const EMPTY_STATS: DashboardStats = {
  nc: 0,
  ec: 0,
  complexity: 0,
  totalNodes: 0,
  totalEdges: 0,
  debt: 0,
  debtDelta: 0,
};

const MAX_SESSIONS = 30;
const AUTH_TOKEN_KEY = "node-coverage-token";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAnalysisEngine() {
  // 1. Core States
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("javascript");
  const [requirements, setRequirements] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // History sessions state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sessionLoadedFromHistory, setSessionLoadedFromHistory] = useState<boolean>(false);
  const [manualWorkflowStep, setManualWorkflowStep] = useState<number>(0);
  const skipTemplateAutoLoadRef = React.useRef(false);
  const [sessions, setSessions] = useState<AnalysisSession[]>(seedSessions);

  // 2. Local simulation timers
  const [simulationIntervalId, setSimulationIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Live UTC clock (refreshes every minute)
  const [utcNow, setUtcNow] = useState<string>(() => new Date().toISOString().substring(0, 10));
  useEffect(() => {
    const timer = setInterval(() => setUtcNow(new Date().toISOString().substring(0, 10)), 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. Load active template upon language change
  useEffect(() => {
    if (skipTemplateAutoLoadRef.current) {
      // External source (Git analyzer/local file) supplied code; skip template injection
      skipTemplateAutoLoadRef.current = false;
      return;
    }
    if (sessionLoadedFromHistory) {
      setSessionLoadedFromHistory(false);
      return;
    }
    const matched = TEMPLATES.find((t) => t.language === selectedLanguage);
    if (matched) {
      setRequirements(matched.requirements.trim());
      setCode(matched.code.trim());

      // Auto-load fallback first as responsive base
      const localFallback = FALLBACK_RESULTS[selectedLanguage];
      const copiedNodes = localFallback.nodes.map((n) => ({
        ...n,
        isCovered: false,
        executionCount: 0,
      }));

      setAnalysisResults({ ...localFallback, nodes: copiedNodes });
      setSelectedNodeId(copiedNodes[0]?.id || null);
      setOptimizationResult(null);
    }
  }, [selectedLanguage]);

  // Clean-up active simulations on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalId) clearInterval(simulationIntervalId);
    };
  }, [simulationIntervalId]);

  // Helper for direct session insertion
  const saveSessionDirect = (
    lang: SupportedLanguage,
    codeVal: string,
    reqs: string,
    results: AnalysisResults
  ) => {
    const total = results.nodes.length;
    const covered = results.nodes.filter((n) => n.isCovered).length;
    const nc = total > 0 ? Math.round((covered / total) * 100) : 0;

    const newSession: AnalysisSession = {
      id: `session-auto-${Date.now()}`,
      title: `자동 분석 런 (${lang}) - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      language: lang,
      code: codeVal,
      requirements: reqs,
      analysisResults: results,
      coveragePercent: nc,
      complexity: results.complexity.cyclomaticComplexity,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      localStorage.setItem("node-coverage-sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadSession = (session: AnalysisSession) => {
    setCode(session.code);
    setRequirements(session.requirements);
    setAnalysisResults(session.analysisResults);
    setSelectedNodeId(session.analysisResults.nodes[0]?.id || null);
    setOptimizationResult(null);

    if (session.language !== selectedLanguage) {
      setSessionLoadedFromHistory(true);
      setSelectedLanguage(session.language);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem("node-coverage-sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    localStorage.removeItem("node-coverage-sessions");
  };

  const handleSaveCurrentSession = (title?: string) => {
    if (!analysisResults) return;
    const total = analysisResults.nodes.length;
    const covered = analysisResults.nodes.filter((n) => n.isCovered).length;
    const nc = total > 0 ? Math.round((covered / total) * 100) : 0;

    const newSession: AnalysisSession = {
      id: `session-manual-${Date.now()}`,
      title: title || `수동 저장 런 (${selectedLanguage}) - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      language: selectedLanguage,
      code,
      requirements,
      analysisResults,
      coveragePercent: nc,
      complexity: analysisResults.complexity.cyclomaticComplexity,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      localStorage.setItem("node-coverage-sessions", JSON.stringify(updated));
      return updated;
    });
  };

  // 외부 소스(Git/로컬 파일) 유입: 템플릿 자동 로드 우회 후 언어/코드/요건 주입
  const handleExternalSource = (lang: SupportedLanguage, sourceCode: string, reqs: string) => {
    if (lang !== selectedLanguage) {
      skipTemplateAutoLoadRef.current = true;
    }
    setSelectedLanguage(lang);
    setCode(sourceCode);
    setRequirements(reqs);
    setOptimizationResult(null);
  };

  // Handle active analysis through server-side Gemini Proxy
  const handleAnalyzeCode = async () => {
    setIsAnalyzing(true);
    setOptimizationResult(null);

    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ code, language: selectedLanguage, requirements }),
      });

      if (!response.ok) {
        throw new Error("API responded with an unexpected status code.");
      }

      const data = await response.json();

      // Initialize simulator values
      if (data && data.nodes) {
        const parsedNodes = data.nodes.map((n: CFGNode) => ({
          ...n,
          isCovered: false,
          executionCount: 0,
        }));

        const resultPayload: AnalysisResults = { ...data, nodes: parsedNodes };

        setAnalysisResults(resultPayload);
        setSelectedNodeId(parsedNodes[0]?.id || null);
        saveSessionDirect(selectedLanguage, code, requirements, resultPayload);
      }
    } catch (err) {
      console.warn("Server API failed or un-auth key detection. Applying high fidelity fallback client-model.");

      // Fallback is already loaded natively, so make sure to reset execution status
      const localFallback = FALLBACK_RESULTS[selectedLanguage];
      const copiedNodes = localFallback.nodes.map((n) => ({
        ...n,
        isCovered: false,
        executionCount: 0,
      }));

      const resultPayload = { ...localFallback, nodes: copiedNodes };

      setAnalysisResults(resultPayload);
      setSelectedNodeId(copiedNodes[0]?.id || null);
      saveSessionDirect(selectedLanguage, code, requirements, resultPayload);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 저장소 배치(다중 파일) 통합 분석
  const handleBatchAnalyzeCode = async (
    batchFiles: BatchSourceFile[],
    batchRequirements: string
  ) => {
    if (batchFiles.length === 0) return;
    setIsAnalyzing(true);
    setOptimizationResult(null);

    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }

    try {
      const response = await fetch("/api/analyze/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ files: batchFiles, requirements: batchRequirements }),
      });

      if (!response.ok) {
        throw new Error("API responded with an unexpected status code.");
      }

      const data = await response.json();
      if (data && data.results && data.results.nodes) {
        const parsedNodes = data.results.nodes.map((n: CFGNode) => ({
          ...n,
          isCovered: false,
          executionCount: 0,
        }));
        const resultPayload: AnalysisResults = { ...data.results, nodes: parsedNodes };

        setCode(data.mergedCode || batchFiles.map((f) => f.code).join("\n\n"));
        setRequirements(batchRequirements);
        setAnalysisResults(resultPayload);
        setSelectedNodeId(parsedNodes[0]?.id || null);
        saveSessionDirect(selectedLanguage, data.mergedCode ?? "", batchRequirements, resultPayload);
      }
    } catch (err) {
      console.warn("Server Batch API failed. Merging single-result fallbacks as repo-level phantom graph.");

      // 배치 실패 폴백: 각 파일의 단일 폴백 결과를 병합해 통합 세션 구성
      const merged: AnalysisResults = {
        nodes: [],
        edges: [],
        rtm: [],
        complexity: { cyclomaticComplexity: 0, totalNodes: 0, totalEdges: 0 },
        languageInsights: "",
      };
      const mergedCodeParts: string[] = [];
      for (const f of batchFiles) {
        const localFallback = FALLBACK_RESULTS[f.language];
        const fileStem = f.path.split("/").pop()?.replace(/[^A-Za-z0-9_]/g, "_") || "file";
        const prefixedNodes = localFallback.nodes.map((n) => ({
          ...n,
          id: `${fileStem}__${n.id}`,
          sourceFile: f.path,
          isCovered: false,
          executionCount: 0,
        }));
        merged.nodes.push(...prefixedNodes);
        merged.edges.push(...localFallback.edges.map((e) => ({
          ...e,
          source: `${fileStem}__${e.source}`,
          target: `${fileStem}__${e.target}`,
        })));
        merged.rtm.push(...localFallback.rtm.map((t) => ({
          ...t,
          mappedNodeIds: t.mappedNodeIds.map((id) => `${fileStem}__${id}`),
        })));
        mergedCodeParts.push(`/** ===== FILE: ${f.path} ===== */\n${f.code}`);
      }
      merged.complexity.cyclomaticComplexity =
        batchFiles.reduce((sum, f) => sum + (FALLBACK_RESULTS[f.language]?.complexity.cyclomaticComplexity || 0), 0);
      merged.complexity.totalNodes = merged.nodes.length;
      merged.complexity.totalEdges = merged.edges.length;

      const mergedCode = mergedCodeParts.join("\n\n");
      setCode(mergedCode);
      setRequirements(batchRequirements);
      setAnalysisResults(merged);
      setSelectedNodeId(merged.nodes[0]?.id || null);
      saveSessionDirect(selectedLanguage, mergedCode, batchRequirements, merged);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Perform AI-powered agentic loop coverage constraint solver
  const handleRunAgentOptimization = async () => {
    if (!analysisResults || !selectedNodeId) return;
    const activeNode = analysisResults.nodes.find((n) => n.id === selectedNodeId);
    if (!activeNode) return;

    setIsOptimizing(true);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          uncoveredNodeId: activeNode.id,
          code,
          language: selectedLanguage,
          nodeDescription: activeNode.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Optimize API failure.");
      }

      const data = await response.json();
      setOptimizationResult(data);
    } catch (err) {
      console.warn("Optimize API failure. Rendering fallback mock testing data.");

      // 저비용 클라이언트 모의 폴백 (언어별 샘플 테스트 생성)
      const mockOptimizeResponse: OptimizationResult = {
        symbolicConstraints: `PathPredicate(x) => [${
          selectedLanguage === "javascript"
            ? "amount > 0 && stockAvailable === true && paymentResult.status === 'APPROVED'"
            : selectedLanguage === "java"
            ? "policy != null && amount <= policy.getMaxTransferLimit()"
            : selectedLanguage === "cpp"
            ? "logger != NULL && ALERT_LEVEL(sensorValue) === 1"
            : "isinstance(data, dict) && 'payload' in data"
        } ]`,
        testInputs: [
          {
            param: "Payload Input",
            value:
              selectedLanguage === "javascript"
                ? "{ orderId: 'TX_1001', amount: 3500 }"
                : selectedLanguage === "java"
                ? "policy = VipAccountPolicy, amount = 100000"
                : selectedLanguage === "cpp"
                ? "sensorValue = 1200, Callback = fileLogger"
                : "data = {'payload': 250.5}",
            explanation: "Target covered path generator constraint solver check",
          },
        ],
        unitTestCode:
          selectedLanguage === "javascript"
            ? `test('N${activeNode.id} reachability', async () => {\n  const res = await processOrder('TX_1001', 'Widget', 3500);\n  expect(res.success).toBe(true);\n});`
            : selectedLanguage === "java"
            ? `void testN${activeNode.id}() {\n  AccountPolicy vip = new VipAccountPolicy();\n  assertTrue(executeTransfer(vip, 100000.0));\n}`
            : selectedLanguage === "cpp"
            ? `void testN${activeNode.id}() {\n  int status = handleSensorInput(1200, fileLogger);\n  assert(status == 1);\n}`
            : `def test_n${activeNode.id}():\n  result = parse_telemetry_payload({"payload": 250.5})\n  assert result["status"] == "SUCCESS"`,
        autofixSuggestion: `// N${activeNode.id} Automatic Code Fix Recommendation\n// 아키텍처적 구조적 블로킹 또는 Dead Code 우회를 위한 지능형 제어 절차\n${
          selectedLanguage === "javascript"
            ? "if (paymentResult.status === 'APPROVED') { \n  // REQ-03 원장 백업 기록부 보장 절차\n  await saveLogToLedger(orderId, 'SUCCESS');\n}"
            : "if (amount <= limit) {\n  // 요요 효과 상속 경로 예외 우회 고도화\n  return true;\n}"
        }`,
      };
      setOptimizationResult(mockOptimizeResponse);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 4. Interactive Simulation Action Handlers
  const handleSimulateNodeExecution = (nodeId: string) => {
    setAnalysisResults((prev) => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            isCovered: true,
            executionCount: (node.executionCount || 0) + 1,
          };
        }
        return node;
      });
      return { ...prev, nodes: updatedNodes };
    });
  };

  const handleResetCoverage = () => {
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }

    setAnalysisResults((prev) => {
      if (!prev) return prev;
      const resetNodes = prev.nodes.map((node) => ({
        ...node,
        isCovered: false,
        executionCount: 0,
      }));
      return { ...prev, nodes: resetNodes };
    });
  };

  // Run full testing suite in sequence (visual animation callback simulation)
  const handleRunFullTestSuite = () => {
    if (!analysisResults) return;
    handleResetCoverage();

    const reachableNodes = analysisResults.nodes.filter((node) => node.reachability !== "unreachable");
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= reachableNodes.length) {
        clearInterval(interval);
        setSimulationIntervalId(null);
        return;
      }

      const target = reachableNodes[currentIdx];
      handleSimulateNodeExecution(target.id);
      currentIdx++;
    }, 450);

    setSimulationIntervalId(interval);
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setOptimizationResult(null);
  };

  // Calculators for overall dynamic metrics
  const stats = React.useMemo<DashboardStats>(() => {
    if (!analysisResults) {
      return EMPTY_STATS;
    }
    const nodesCount = analysisResults.nodes.length;
    const coveredNodesCount = analysisResults.nodes.filter((n) => n.isCovered).length;

    const ncPercent = nodesCount > 0 ? Math.round((coveredNodesCount / nodesCount) * 100) : 0;

    const nodeById: Record<string, CFGNode> = {};
    for (const n of analysisResults.nodes) {
      nodeById[n.id] = n;
    }
    const coveredEdgesCount = analysisResults.edges.filter((e) => {
      const source = nodeById[e.source];
      const target = nodeById[e.target];
      return !!source?.isCovered && !!target?.isCovered;
    }).length;
    const ecPercent =
      analysisResults.edges.length > 0
        ? Math.round((coveredEdgesCount / analysisResults.edges.length) * 100)
        : 0;

    // 기술 부채 지수: 미커버 노드 비율(가중 10) + 순환 복잡도(최대 30, 가중 2) 합산
    const uncoveredRatio = nodesCount > 0 ? 1 - coveredNodesCount / nodesCount : 0;
    const complexityFactor = Math.min(analysisResults.complexity.cyclomaticComplexity, 30) / 30;
    const debt = Math.round((uncoveredRatio * 10 + complexityFactor * 2) * 10) / 10;

    // 과거 세션 대비 상대 추이 (각 세션의 coverage/complexity로 부채 지수 역산)
    let debtDelta = 0;
    if (sessions.length > 0) {
      const sessionDebts = sessions.map((s) => {
        const uncov = Math.max(0, 100 - s.coveragePercent) / 100;
        const comp = Math.min(s.complexity || 0, 30) / 30;
        return uncov * 10 + comp * 2;
      });
      const avgDebt = sessionDebts.reduce((a, b) => a + b, 0) / sessionDebts.length;
      debtDelta = Math.round((debt - avgDebt) * 10) / 10;
    }

    return {
      nc: ncPercent,
      ec: ecPercent,
      complexity: analysisResults.complexity.cyclomaticComplexity,
      totalNodes: nodesCount,
      totalEdges: analysisResults.edges.length,
      debt,
      debtDelta,
    };
  }, [analysisResults, sessions]);

  const activeSelectedNode = analysisResults?.nodes.find((n) => n.id === selectedNodeId) || null;

  return {
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
    handleBatchAnalyzeCode,
  };
}

function seedSessions(): AnalysisSession[] {
  const tryLoad = (): AnalysisSession[] | null => {
    try {
      const saved = localStorage.getItem("node-coverage-sessions");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage loading failed", e);
    }
    return null;
  };
  const loaded = tryLoad();
  if (loaded) return loaded;

  const initialSessions: AnalysisSession[] = [
    {
      id: "init-js",
      title: "기본 런 #1 - 비동기 주문 트랜잭션 (JavaScript)",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 10) + " 10:15:22 UTC",
      language: "javascript",
      code: `/**
 * REQ-01: 비동기 결제 가맹점 인증 및 트랜잭션 안전성 체크
 * REQ-02: 검증 절차 (N3, N4)
 * REQ-03: 최종 저널 기록 보장 (N5)
 */
async function processOrder(orderId, item, amount) {
  console.log("Starting order process:", orderId);
  if (amount <= 0) {
    throw new Error("Invalid payment amount");
  }
  const authenticated = await verifyMerchantCredentials();
  if (!authenticated) {
    return { success: false, code: "AUTH_FAILED" };
  }
  try {
    const paymentResult = await gatewayPaymentCharge(amount);
    if (paymentResult.status === 'APPROVED') {
      await saveLogToLedger(orderId, 'SUCCESS');
      return { success: true, ref: paymentResult.txRef };
    } else {
      return { success: false, code: "DECLINED" };
    }
  } catch (err) {
    await saveLogToLedger(orderId, 'FATAL_ERROR');
    throw err;
  }
}`,
      requirements: `REQ-01: 비동기 결제 가맹 점검 및 트랜잭션 무결성 검사
REQ-02: 가맹점 또는 비보안 채널 원격 차단 검사
REQ-03: 최종 저널 회계 원장 기록 및 백업 기능`,
      analysisResults: FALLBACK_RESULTS["javascript"],
      coveragePercent: 100,
      complexity: FALLBACK_RESULTS["javascript"].complexity.cyclomaticComplexity,
    },
    {
      id: "seed-java",
      title: "기본 런 #2 - 다형성 요요 상속 훅 (Java)",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 10) + " 09:44:11 UTC",
      language: "java",
      code: `public class CustomBillingController extends AbstractBillingFlow {
    @Override
    public boolean executeTransfer(AccountPolicy policy, double amount) {
        if (policy == null) {
            logError("Null policy policy bypass error");
            return false;
        }
        if (amount > policy.getMaxTransferLimit()) {
            triggerErosionAlarm("Amount exceeds bounds");
            return false;
        }
        boolean status = super.performWireTransfer(amount);
        return status;
    }
}`,
      requirements: `REQ-04: 다형성 상속 한도 체크 및 실시간 에러 핸들러
REQ-05: 안전 이체 내역 레지스트리 비휘발성 저장`,
      analysisResults: FALLBACK_RESULTS["java"],
      coveragePercent: 100,
      complexity: FALLBACK_RESULTS["java"].complexity.cyclomaticComplexity,
    },
  ];
  return initialSessions;
}