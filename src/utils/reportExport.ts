import type { AnalysisResults, OptimizationResult, SupportedLanguage } from "../types";

interface ReportContext {
  code: string;
  requirements: string;
  language: SupportedLanguage;
  analysisResults: AnalysisResults;
  optimizationResult?: OptimizationResult | null;
  stats: {
    nc: number;
    ec: number;
    complexity: number;
    totalNodes: number;
    totalEdges: number;
    debt: number;
  };
}

function esc(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

export function buildJsonReport(ctx: ReportContext): string {
  return JSON.stringify(
    {
      meta: {
        generatedAt: new Date().toISOString(),
        app: "Node Coverage Analyzer",
        language: ctx.language,
        requirements: ctx.requirements,
      },
      code: ctx.code,
      analysisResults: ctx.analysisResults,
      coverage: ctx.stats,
      optimization: ctx.optimizationResult ?? null,
    },
    null,
    2
  );
}

export function buildMarkdownReport(ctx: ReportContext): string {
  const { analysisResults: a, stats, language, requirements, code, optimizationResult } = ctx;
  const lines: string[] = [];

  lines.push("# Node Coverage Analysis Report", "");
  lines.push(`- **언어**: ${language}`);
  lines.push(`- **생성 시각**: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## 인기요구사항 (Requirements Specification for RTM)", "");
  lines.push("```", requirements || "(요건사항 미입력)", "```", "");
  lines.push("");
  lines.push("## 커버리지 지표", "");
  lines.push("| 지표 | 값 |", "|------|-----|", `| 노드 커버리지 (NC) | ${stats.nc}% |`, `| 에지 커버리지 (EC) | ${stats.ec}% |`, `| 순환 복잡도 (Cyclomatic) | ${stats.complexity} |`, `| 총 노드 / 에지 | ${stats.totalNodes} / ${stats.totalEdges} |`, `| 기술 부채 지수 | ${stats.debt.toFixed(1)} dS |`, "");
  lines.push("## CFG 노드", "");
  lines.push("| ID | Label | Type | Reachability | File | 설명 |", "|----|-------|------|--------------|------|------|");
  for (const n of a.nodes) {
    lines.push(`| ${esc(n.id)} | ${esc(n.label)} | ${n.type} | ${n.reachability} | ${esc(n.sourceFile ?? "")} | ${esc(n.description)} |`);
  }
  lines.push("");
  lines.push("## CFG 에지", "");
  lines.push("| Source | Target | Condition |", "|--------|--------|-----------|");
  for (const e of a.edges) {
    lines.push(`| ${esc(e.source)} | ${esc(e.target)} | ${esc(e.condition ?? "-")} |`);
  }
  lines.push("");
  lines.push("## RTM (Requirements Traceability Matrix)", "");
  lines.push("| Req ID | 요건 | 매핑 노드 |", "|--------|------|-----------|");
  for (const t of a.rtm) {
    lines.push(`| ${esc(t.reqId)} | ${esc(t.reqText)} | ${esc(t.mappedNodeIds.join(", "))} |`);
  }
  lines.push("");
  lines.push("## 언어 인사이트", "");
  lines.push(`> ${a.languageInsights || "(인사이트 없음)"}`);
  lines.push("");

  if (optimizationResult) {
    lines.push("## 커버리지 최적화 제안", "");
    lines.push("### Symbolic Constraints", "", "```", optimizationResult.symbolicConstraints, "```", "");
    lines.push("### 테스트 입력", "");
    lines.push("| 파라미터 | 값 | 설명 |", "|----------|-----|------|");
    for (const t of optimizationResult.testInputs || []) {
      lines.push(`| ${esc(t.param)} | ${esc(t.value)} | ${esc(t.explanation)} |`);
    }
    lines.push("");
    lines.push("### 단위 테스트 코드", "", "```", optimizationResult.unitTestCode, "```", "");
    lines.push("### AutoFix 제안", "", "```", optimizationResult.autofixSuggestion, "```", "");
    lines.push("");
  }

  lines.push("## 소스 코드", "");
  lines.push("```", code, "```");

  return lines.join("\n");
}

function downloadReport(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonReport(ctx: ReportContext): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadReport(`nodecov-report-${stamp}.json`, buildJsonReport(ctx), "application/json");
}

export function downloadMarkdownReport(ctx: ReportContext): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadReport(`nodecov-report-${stamp}.md`, buildMarkdownReport(ctx), "text/markdown");
}