import React, { useState } from "react";
import { CFGNode, OptimizationResult } from "../types";
import { Sparkles, Play, ShieldAlert, Code2, Cpu, CheckCircle, RefreshCcw, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AgenticOptimizerProps {
  selectedNode: CFGNode | null;
  code: string;
  language: string;
  isOptimizing: boolean;
  onRunOptimization: () => void;
  optimizationResult: OptimizationResult | null;
}

export function AgenticOptimizer({
  selectedNode,
  code,
  language,
  isOptimizing,
  onRunOptimization,
  optimizationResult,
}: AgenticOptimizerProps) {
  
  if (!selectedNode) {
    return (
      <div id="optimizer-empty-state" className="border border-[#22211f] bg-[#0c0c0c]/80 rounded-sm p-8 text-center text-stone-500">
        <Sparkles className="w-10 h-10 mx-auto text-[#A1824A]/50 mb-3 animate-pulse" />
        <h3 className="text-sm font-sans font-bold text-gray-300 mb-1 tracking-wider uppercase">
          Agentic Coverage Optimization Center
        </h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-sans">
          대용량 정적 분석에서 탐지된 미검증 노드나 의사결정 포인트를 CFG 그래프에서 선택하시면, 
          인공지능 에이전트가 자율 기호 실행을 가동하여 최적의 테스트 케이스 및 자동 패치를 도출합니다.
        </p>
      </div>
    );
  }

  return (
    <div id="optimizer-active-section" className="border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-6">
      {/* Target summary bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-[#111111] pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#A1824A]/10 text-[#A1824A] border border-[#A1824A]/25 rounded-xs">
            <Cpu className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <h3 className="text-sm font-sans text-[#A1824A] font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <span>Agentic Coverage Solver</span>
              <Sparkles className="w-3.5 h-3.5 fill-[#A1824A] text-[#A1824A]" />
            </h3>
            <span className="text-[11px] text-gray-400 font-sans font-medium">
              Targeting Node <strong className="text-white font-mono">N{selectedNode.id}</strong> ({selectedNode.label})
            </span>
          </div>
        </div>

        <button
          id={`optimize-agent-btn-${selectedNode.id}`}
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2 bg-[#A1824A] hover:bg-[#A1824A]/95 text-white text-xs font-bold rounded-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:scale-[1.01] active:scale-[0.99] border border-[#A1824A]/10"
        >
          {isOptimizing ? (
            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 fill-white" />
          )}
          <span>{isOptimizing ? "에이전트 제약 계산 중..." : "AI 자율 테스트 및 수정 제안 실행"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isOptimizing ? (
          <motion.div
            key="optimizing-loader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#A1824A] animate-spin" />
              <div className="absolute inset-2 rounded-full border-b-2 border-stone-800 animate-spin flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#A1824A] animate-pulse" />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#A1824A]">
              AI 에이전트 오케스트레이션 가동 중
            </span>
            <p className="text-[10px] text-gray-500 mt-1 max-w-sm font-sans">
              Tree-Sitter AST 차분화 정밀 매칭 및 Symbolic Execution 프리디케이트 식별, 
              자동 테스트 기입 노드 합성 및 수정 패치 빌드 오버헤드 보정 중...
            </p>
          </motion.div>
        ) : optimizationResult ? (
          <motion.div
            key="optimization-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Left box: Symbolic execution predicates + Test input parameter map */}
            <div className="flex flex-col gap-4">
              {/* Symbolic Predicate Banner */}
              <div className="bg-[#111]/30 border border-[#22211f] p-4 rounded-sm">
                <span className="text-gray-500 text-[10px] font-mono block mb-1">
                  기호 실행 제약 조건식 (Symbolic Cost Constraints)
                </span>
                <p className="text-xs font-mono font-bold text-[#A1824A] select-all leading-normal bg-[#080808] p-2.5 rounded-xs border border-[#222]">
                  {optimizationResult.symbolicConstraints}
                </p>
              </div>

              {/* Concrete Mock input table */}
              <div className="bg-[#111]/30 border border-[#222] p-4 rounded-sm flex-1">
                <span className="text-stone-300 text-[11px] font-sans block mb-2 font-bold flex items-center gap-1.5 border-b border-[#111] pb-1.5 uppercase tracking-wide">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  합성된 테스트 케이스 입력값 (Synthesized Testing Parameters)
                </span>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {optimizationResult.testInputs.map((input, idx) => (
                    <div key={`param-${idx}`} className="bg-[#080808] border border-[#222]/80 rounded-xs p-2.5 flex justify-between items-start text-xs font-mono">
                      <div>
                        <span className="text-[#A1824A] font-bold block">{input.param}</span>
                        <p className="text-[10px] text-gray-400 leading-normal mt-0.5 font-sans">
                          {input.explanation}
                        </p>
                      </div>
                      <span className="bg-[#111] px-2 py-0.5 rounded-xs border border-stone-800 text-emerald-400 font-semibold select-all">
                        {input.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right box: Unit test code example + Autofix suggestion */}
            <div className="flex flex-col gap-4">
              {/* Test Code Block mockup */}
              <div className="bg-[#111]/30 border border-[#222] p-4 rounded-sm flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-stone-300 text-[11px] font-sans block mb-2 font-bold flex items-center gap-1.5 border-b border-[#111] pb-1.5 uppercase tracking-wide">
                    <Code2 className="w-3.5 h-3.5 text-[#A1824A]" />
                    자동 합성된 단위 테스트 코드 (Generated Test Harness)
                  </span>
                  <pre className="text-[10px] text-stone-200 font-mono select-all overflow-auto max-h-[160px] bg-[#080808] p-2.5 rounded-xs border border-[#222] leading-normal whitespace-pre">
                    {optimizationResult.unitTestCode}
                  </pre>
                </div>
              </div>

              {/* Autofix refactoring suggestion code block */}
              <div className="bg-emerald-950/5 border border-emerald-950/20 p-4 rounded-sm flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-emerald-400 text-[11px] font-sans block mb-2 font-bold flex items-center gap-1.5 border-b border-emerald-950/15 pb-1.5 uppercase tracking-wide">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    도달 제한 및 결함 보정 패치 제언 (Autofix & Refactoring Patch)
                  </span>
                  <pre className="text-[10px] text-emerald-350 font-mono select-all overflow-auto max-h-[160px] bg-[#080808] p-2.5 rounded-xs border border-emerald-950/20 leading-normal whitespace-pre">
                    {optimizationResult.autofixSuggestion}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="optimize-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <Cpu className="w-8 h-8 text-[#A1824A]/30 mb-2 animate-pulse" />
            <span className="text-xs text-stone-400 font-sans">
              우측 상단의 "AI 자율 테스트 및 수정 제안 실행" 버튼을 누르시면<br />
              현 대상 노드 <strong className="text-[#A1824A] font-mono">N{selectedNode.id}</strong>을 위한 자동 기호 실행 제약 분석이 진행됩니다.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
