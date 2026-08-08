import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResults, BatchSourceFile, CFGNode, OptimizationResult } from "../../src/types";

// Gemini 클라이언트는 요청 시점에 lazily 초기화 (GEMINI_API_KEY 주입)
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
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

const GEMINI_MODEL = "gemini-3.5-flash";

// ============================================================================
// /api/analyze — CFG/노드/에지/RTM 추출 (프론트 src/types.ts와 스키마 계약 정합)
// ============================================================================
const ANALYZE_SYSTEM_PROMPT = `You are an advanced software static analysis and Control Flow Graph (CFG) creation engine. 
Based on the programming language specific traits and user's source code, you must construct a CFG (nodes, control flow edges), calculate Cyclomatic Complexity, and build a Requirements Traceability Matrix (RTM) mapped to the provided system requirements.

Language-Specific Analysis Directives:
- C/C++: Track pointer references, macros, templates, and indirect jumps. Highlight dangling pointer possibilities.
- Java: Consider Polymorphism, dynamic binding, and inheritance. Highlight Yo-yo inheritance effects.
- JavaScript/Web: Model asynchronous event-driven async/await structures, promises, callbacks, and event loop context.
- Python: Address dynamic typing runtime type transformations, dynamic function maps.

Ensure your JSON outputs exactly align with the specified schema type structure. DO NOT invent schema attributes.`;

export const ANALYZE_RESPONSE_SCHEMA = {
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
            enum: ["start", "basic", "decision", "call", "end"],
          },
          lineStart: { type: Type.INTEGER },
          lineEnd: { type: Type.INTEGER },
          reachability: {
            type: Type.STRING,
            enum: ["reachable", "unreachable", "conditional"],
          },
          description: { type: Type.STRING },
          sourceFile: { type: Type.STRING, description: "Source file path this node belongs to (multi-file batch only)" },
          languageSpecificAspect: { type: Type.STRING, description: "Pointer jump, async handler, polymorphism annotation etc." },
        },
      },
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
          condition: { type: Type.STRING, description: "Edge label condition like 'x > 5' or 'err !== null'" },
        },
      },
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
            items: { type: Type.STRING },
          },
        },
      },
    },
    complexity: {
      type: Type.OBJECT,
      required: ["cyclomaticComplexity", "totalNodes", "totalEdges"],
      properties: {
        cyclomaticComplexity: { type: Type.INTEGER },
        totalNodes: { type: Type.INTEGER },
        totalEdges: { type: Type.INTEGER },
      },
    },
    languageInsights: {
      type: Type.STRING,
      description: "Advanced specific text feedback analyzing semantic complexities and software erosion risks.",
    },
  },
} as const;

// 응답 형상이 프론트 AnalysisResults 와 일치하는지 검증 후 반환
export function parseAnalysisResult(text: string): AnalysisResults {
  const parsed = JSON.parse(text || "{}");
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || !Array.isArray(parsed.rtm)) {
    throw new Error("Gemini 분석 응답 형식이 올바르지 않습니다.");
  }
  return parsed as AnalysisResults;
}

export async function runAnalysisExtraction(code: string, language: string, requirements: string): Promise<AnalysisResults> {
  const client = getAiClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Source Code:
\`\`\`${language}
${code}
\`\`\`

System Requirements (NLP text or bullets):
${requirements || "General operational logic of the code"}

Extract the CFG nodes, edges, RTM tracking, cyclomatic complexity metrics, and language specific insights in JSON layout.`,
    config: {
      systemInstruction: ANALYZE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYZE_RESPONSE_SCHEMA,
    },
  });
  return parseAnalysisResult(response.text || "{}");
}

// 몸체가 수정된 배치 분석: 다수의 소스 파일을 단일 CFG로 통합 추출
const BATCH_ANALYZE_SYSTEM_PROMPT = `You are an advanced software static analysis and Control Flow Graph (CFG) creation engine.

You are given a MULTI-FILE source tree. Analyze ALL files as a single integrated codebase:
- Construct a unified CFG where nodes from the entrypoint and cross-file calls are connected (call edges across files).
- For every node you emit, the "sourceFile" attribute MUST be set to the exact file path provided in the marker header (e.g. "src/index.ts").
- Node ids must be unique across the whole repository. Prefix ids with a short stable file stem when files collide (e.g. "index__N1", "auth__N2").
- Calculate a single Cyclomatic Complexity for the whole callable graph reachable from the main entrypoint.
- Build an RTM mapping NLP requirements across the merged set of files, referencing unique node ids.
- languageInsights should summarize cross-file coupling, module boundaries, and repository-level erosion risks.

Language-Specific Analysis Directives:
- C/C++: Track pointer references, macros, templates, indirect jumps, dangling pointer possibilities.
- Java: Consider Polymorphism, dynamic binding, inheritance; highlight Yo-yo inheritance.
- JavaScript/Web: Model async/await, promises, callbacks, event loop context.
- Python: Address dynamic typing, dynamic function maps.

Ensure your JSON outputs exactly align with the specified schema structure. DO NOT invent schema attributes.`;

// 표기된 multi-file source를 단일 프롬프트 버퍼로 결합
export function buildMultiFileBuffer(files: BatchSourceFile[], requirements: string): string {
  const body = files
    .map((f) => `// ===== FILE: ${f.path} (${f.language}) =====\n\`\`\`${f.language}\n${f.code}\n\`\`\`\n`)
    .join("\n");
  return `Project Source Tree:
${body}

System Requirements (NLP text or bullets):
${requirements || "General operational logic of the code"}

Analyze the whole multi-file project and output a MERGED CFG across files with cross-file edges, a single RTM, and repository-level complexity + language insights.`;
}

// 파싱 후 노드 id 중복/소스파일 누락을 정제
export function normalizeBatchResult(results: AnalysisResults, files: BatchSourceFile[]): AnalysisResults {
  const sourceFiles = new Set(files.map((f) => f.path));
  const idIndexByFile = new Map<string, number>();
  const idAlias = new Map<string, string>();

  const nodes = (results.nodes || []).map((n) => {
    const src = n.sourceFile || "";
    const keepSrc = src && sourceFiles.has(src) ? src : "unknown";
    const base = keepSrc !== "unknown" ? `${sanitizeStem(keepSrc)}__${n.id.replace(/^[A-Za-z0-9_]+__/, "")}` : n.id;
    const idx = idIndexByFile.get(base) || 0;
    idIndexByFile.set(base, idx + 1);
    const finalId = idx === 0 ? base : `${base}_${idx}`;
    idAlias.set(n.id, finalId);
    return { ...n, id: finalId, sourceFile: keepSrc === "unknown" ? undefined : keepSrc } as CFGNode;
  });

  const edges = (results.edges || []).map((e) => ({
    ...e,
    source: idAlias.get(e.source) || e.source,
    target: idAlias.get(e.target) || e.target,
  }));

  const rtm = (results.rtm || []).map((t) => ({
    ...t,
    mappedNodeIds: (t.mappedNodeIds || []).map((id) => idAlias.get(id) || id),
  }));

  return { ...results, nodes, edges, rtm };
}

function sanitizeStem(filePath: string): string {
  const stem = filePath.split("/").pop() || filePath;
  return stem.replace(/[^A-Za-z0-9_]/g, "_");
}

export async function runBatchAnalysisExtraction(
  files: BatchSourceFile[],
  requirements: string
): Promise<AnalysisResults> {
  const client = getAiClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildMultiFileBuffer(files, requirements),
    config: {
      systemInstruction: BATCH_ANALYZE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ANALYZE_RESPONSE_SCHEMA,
    },
  });
  const parsed = parseAnalysisResult(response.text || "{}");
  return normalizeBatchResult(parsed, files);
}

// ============================================================================
// /api/optimize — 커버리지 제약 해결 (AI Agentic Coverage Solver)
// ============================================================================
const OPTIMIZE_SYSTEM_PROMPT = `You are a testing automation assistant focused on Agentic Coverage Solver. 
Analyze the target node and code, determine what symbolic constraints are required to navigate the execution paths into this node, spit out concrete Test case values, craft unit test mocks, and suggest code modifications (AutoFix) if the node is structurally blocked (dead code).`;

export const OPTIMIZE_RESPONSE_SCHEMA = {
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
          explanation: { type: Type.STRING },
        },
      },
    },
    unitTestCode: { type: Type.STRING, description: "Full unit test case containing inputs and assertions" },
    autofixSuggestion: { type: Type.STRING, description: "Code block or narrative patching to resolve unreachable barriers" },
  },
} as const;

export function parseOptimizationResult(text: string): OptimizationResult {
  const parsed = JSON.parse(text || "{}");
  if (
    typeof parsed.symbolicConstraints !== "string" ||
    !Array.isArray(parsed.testInputs) ||
    typeof parsed.unitTestCode !== "string" ||
    typeof parsed.autofixSuggestion !== "string"
  ) {
    throw new Error("Gemini 최적화 응답 형식이 올바르지 않습니다.");
  }
  return parsed as OptimizationResult;
}

export async function runCoverageOptimization(
  uncoveredNodeId: string,
  nodeDescription: string,
  code: string,
  language: string
): Promise<OptimizationResult> {
  const client = getAiClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: `We want to explore and cover the Node: "${uncoveredNodeId}" (${nodeDescription})
Codebase Context:
\`\`\`${language}
${code}
\`\`\`

Please output the target constraints, concrete parameter test values, automated unit test code, and refactoring autofix suggestions to eliminate unreachable sections in strict JSON template matching.`,
    config: {
      systemInstruction: OPTIMIZE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: OPTIMIZE_RESPONSE_SCHEMA,
    },
  });
  return parseOptimizationResult(response.text || "{}");
}