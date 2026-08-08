export interface CFGNode {
  id: string;
  label: string;
  type: 'start' | 'basic' | 'decision' | 'call' | 'end';
  lineStart: number;
  lineEnd: number;
  reachability: 'reachable' | 'unreachable' | 'conditional';
  description: string;
  languageSpecificAspect?: string;
  sourceFile?: string;

  // Runtime simulator states
  isCovered?: boolean;
  executionCount?: number;
}

export interface CFGEdge {
  source: string;
  target: string;
  condition?: string;
}

export interface RTMTrace {
  reqId: string;
  reqText: string;
  mappedNodeIds: string[];
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  totalNodes: number;
  totalEdges: number;
}

export interface AnalysisResults {
  nodes: CFGNode[];
  edges: CFGEdge[];
  rtm: RTMTrace[];
  complexity: ComplexityMetrics;
  languageInsights: string;
}

export type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp';

export interface CodeTemplate {
  name: string;
  language: SupportedLanguage;
  requirements: string;
  code: string;
}

// /api/analyze 응답과 동일한 서버 Gemini 스키마 계약 (server/services/gemini.ts)
export interface OptimizationInput {
  param: string;
  value: string;
  explanation: string;
}

export interface OptimizationResult {
  symbolicConstraints: string;
  testInputs: OptimizationInput[];
  unitTestCode: string;
  autofixSuggestion: string;
}

// Git 저장소 스캔 결과 (server/services/repoClone.ts 와 공유 계약)
export interface RepoFileEntry {
  path: string;
  size: number;
  language: SupportedLanguage | null;
}

export interface RepoScanResult {
  repo: string;
  branch: string;
  fileCount: number;
  sourceFileCount: number;
  files: RepoFileEntry[];
  entryCandidates: string[];
}

// 저장소 배치 분석(/api/analyze/batch) 입력 파일 유닛
export interface BatchSourceFile {
  path: string;
  language: SupportedLanguage;
  code: string;
}

export interface BatchAnalyzeResponse {
  mergedCode: string;
  results: AnalysisResults;
  fileCount: number;
  totalBytes: number;
}
