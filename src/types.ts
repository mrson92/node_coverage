export interface CFGNode {
  id: string;
  label: string;
  type: 'start' | 'basic' | 'decision' | 'call' | 'end';
  lineStart: number;
  lineEnd: number;
  reachability: 'reachable' | 'unreachable' | 'conditional';
  description: string;
  languageSpecificAspect?: string;
  
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
