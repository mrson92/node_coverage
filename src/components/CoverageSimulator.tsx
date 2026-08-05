import React from "react";
import { CFGNode } from "../types";
import { Play, RotateCcw, Brackets, CheckCircle, HelpCircle, EyeOff, FileCode } from "lucide-react";
import { motion } from "motion/react";

interface CoverageSimulatorProps {
  code: string;
  nodes: CFGNode[];
  onSimulateNodeExecution: (nodeId: string) => void;
  onResetCoverage: () => void;
  onRunFullSuite: () => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function CoverageSimulator({
  code,
  nodes,
  onSimulateNodeExecution,
  onResetCoverage,
  onRunFullSuite,
  selectedNodeId,
  onSelectNode,
}: CoverageSimulatorProps) {
  
  // 소스 코드를 한 줄씩 쪼개어 가공합니다.
  const lines = code.split("\n");

  // 각 소스 코드 라인을 스캔하여 매핑된 CFGNode를 가져오는 로직
  const getLineMapping = (lineNum: number) => {
    // 1-indexed
    return nodes.find((node) => lineNum >= node.lineStart && lineNum <= node.lineEnd);
  };

  // 계산된 실시간 커버리지 지표들
  const totalNodesWithCode = nodes.length;
  const coveredNodesCount = nodes.filter((n) => n.isCovered).length;
  const coveragePercent = totalNodesWithCode > 0 ? Math.round((coveredNodesCount / totalNodesWithCode) * 100) : 0;

  return (
    <div id="coverage-simulator" className="grid grid-cols-1 xl:grid-cols-3 gap-6 border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-5">
      
      {/* 1. Left Code Editor Block with line highlights */}
      <div className="xl:col-span-2 flex flex-col justify-between border border-[#222] bg-[#080808] rounded-sm overflow-hidden h-[540px]">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#111] bg-[#0c0c0c] text-xs text-gray-400">
          <span className="flex items-center gap-2 font-mono text-stone-300">
            <FileCode className="w-3.5 h-3.5 text-[#A1824A]" />
            Interactive Code Coverage Instrumentation Engine
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-gray-500">
            Read-Only Probed Code View
          </span>
        </div>

        {/* Live Line Viewer */}
        <div className="flex-1 overflow-auto font-mono text-xs p-4 leading-relaxed bg-[#080808] select-none">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const mappedNode = getLineMapping(lineNum);
            
            // Highlight color based on coverage state
            let lineBg = "hover:bg-[#111]/40";
            let indicator = null;
            let rangeGlow = "";

            if (mappedNode) {
              if (mappedNode.id === selectedNodeId) {
                rangeGlow = "border-l-2 border-l-[#A1824A] bg-[#A1824A]/10";
              }

              if (mappedNode.isCovered) {
                lineBg = `${rangeGlow || "bg-emerald-950/10 hover:bg-emerald-950/20 border-l-[3px] border-l-emerald-600"}`;
                indicator = (
                  <span 
                    title={`Covered by N${mappedNode.id} (${mappedNode.executionCount} hits)`}
                    className="w-5 text-right text-emerald-400 font-bold ml-1 cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulateNodeExecution(mappedNode.id);
                    }}
                  >
                    ●
                  </span>
                );
              } else if (mappedNode.reachability === "unreachable") {
                lineBg = `${rangeGlow || "bg-rose-950/10 hover:bg-rose-950/25 border-l-[3px] border-l-rose-800"}`;
                indicator = (
                  <span 
                    title={`Unreachable Dead Code Node N${mappedNode.id}`}
                    className="w-5 text-right text-rose-500 font-bold ml-1 pointer-events-none"
                  >
                    ✕
                  </span>
                );
              } else {
                lineBg = `${rangeGlow || "bg-[#111111]/60 hover:bg-stone-900/40 border-l-[3px] border-l-stone-700"}`;
                indicator = (
                  <span 
                    title={`Uncovered Node N${mappedNode.id}`}
                    className="w-5 text-right text-stone-500 font-bold ml-1 cursor-pointer hover:text-[#A1824A]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulateNodeExecution(mappedNode.id);
                    }}
                  >
                    ○
                  </span>
                );
              }
            }

            return (
              <div 
                id={`code-line-${lineNum}`}
                key={`line-${idx}`} 
                className={`flex items-start transition-all duration-200 py-0.5 px-1 rounded-sm ${lineBg}`}
                onClick={() => {
                  if (mappedNode) {
                    onSelectNode(mappedNode.id);
                  }
                }}
              >
                {/* Line count gutter */}
                <span className="w-8 text-right text-stone-600 select-none pr-3 font-mono border-r border-[#1a1a1a] shrink-0 font-medium">
                  {lineNum}
                </span>

                {/* Node probe indicator */}
                <span className="w-8 flex justify-center shrink-0">
                  {indicator}
                </span>

                {/* Actual line text */}
                <pre className="text-[#cccccc] overflow-visible break-all pl-3 flex-1 font-mono leading-relaxed whitespace-pre-wrap">
                  {line || " "}
                </pre>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right Stats Control and Node hit summary sheet */}
      <div className="flex flex-col justify-between border border-[#222] bg-[#0c0c0c] rounded-sm p-5 h-[540px]">
        
        {/* Top summary layout */}
        <div>
          <h3 className="text-sm font-sans text-[#A1824A] font-semibold mb-3 flex items-center gap-2 border-b border-[#111] pb-2.5">
            <Brackets className="w-4 h-4" />
            <span>Interactive Simulator Unit</span>
          </h3>

          {/* Prominent Radial or Bar Metrics layout */}
          <div className="flex flex-col items-center py-6 bg-[#080808] rounded-sm border border-[#222] mb-5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1 font-medium">
              Active Node Coverage (NC)
            </span>
            <span className="text-4xl font-serif italic text-[#A1824A] mb-1 leading-none">
              {coveragePercent}%
            </span>
            <div className="text-[11px] font-mono text-gray-400 flex gap-2">
              <span>Covered: <strong className="text-emerald-400">{coveredNodesCount}</strong></span>
              <span>/</span>
              <span>Total: <strong className="text-stone-300">{totalNodesWithCode}</strong></span>
            </div>

            <div className="w-[85%] bg-[#0c0c0c] h-1.5 rounded-xs mt-4 overflow-hidden border border-[#222]">
              <div 
                className="h-full bg-[#A1824A] transition-all duration-300"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>

          {/* Simulation Helper Panel */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              id="suite-simulation-btn"
              onClick={onRunFullSuite}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A1824A] hover:bg-[#A1824A]/95 text-white text-xs font-bold rounded-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-[#A1824A]/5"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white pointer-events-none" />
              <span>통합 검증 시뮬레이션 일괄 구동</span>
            </button>

            <button
              id="reset-coverage-btn"
              onClick={onResetCoverage}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#A1824A]/25 text-[#A1824A] text-xs font-bold rounded-sm cursor-pointer transition-all hover:border-[#A1824A]/40"
            >
              <RotateCcw className="w-3.5 h-3.5 pointer-events-none" />
              <span>검증 카운트 초기화</span>
            </button>
          </div>

          {/* Small scrollable checklist of nodes */}
          <div>
            <span className="text-gray-500 text-[10px] font-mono block mb-2 font-semibold tracking-wider">PROBED NODE DECK</span>
            <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs">
              {nodes.map((node) => {
                const isSel = node.id === selectedNodeId;
                return (
                  <div
                    key={`deck-${node.id}`}
                    onClick={() => onSelectNode(node.id)}
                    className={`flex items-center justify-between p-2 rounded-xs border cursor-pointer transition-all ${
                      isSel 
                        ? "bg-[#161616] border-[#A1824A]/45 text-white" 
                        : "bg-[#080808]/40 border-[#222] text-gray-400 hover:border-stone-800 hover:text-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        node.isCovered ? "bg-emerald-500 blink" : node.reachability === "unreachable" ? "bg-rose-600" : "bg-stone-700"
                      }`} />
                      <span className="font-mono font-bold text-[#A1824A]">N{node.id}</span>
                      <span className="text-[11px] truncate max-w-[130px]">{node.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {node.isCovered ? (
                        <span className="text-emerald-400 font-bold bg-emerald-950/15 border border-emerald-900/30 px-1 py-0.2 rounded-xs">
                          {node.executionCount} Hits
                        </span>
                      ) : node.reachability === "unreachable" ? (
                        <span className="text-rose-400 font-bold bg-rose-950/15 border border-rose-900/30 px-1 py-0.2 rounded-xs">
                          Dead Code
                        </span>
                      ) : (
                        <span className="text-stone-500">Uncovered</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info box */}
        <div className="bg-[#111]/50 border border-[#222]/80 p-2.5 rounded-sm text-[10px] text-gray-400 leading-normal">
          💡 <strong>Tip:</strong> 왼쪽 코드 뷰어의 줄을 직접 클릭하거나, 오른쪽 덱의 노드를 선택하여 로컬 모의 타격을 수동으로 트리거 할 수도 있습니다!
        </div>

      </div>

    </div>
  );
}
