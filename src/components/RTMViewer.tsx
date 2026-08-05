import React from "react";
import { RTMTrace, CFGNode } from "../types";
import { ShieldCheck, ShieldAlert, CheckCircle, HelpCircle, FileSpreadsheet } from "lucide-react";
import { motion } from "motion/react";

interface RTMViewerProps {
  rtm: RTMTrace[];
  nodes: CFGNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function RTMViewer({ rtm, nodes, selectedNodeId, onSelectNode }: RTMViewerProps) {
  
  // 요구사항 별로 커버리지 퍼센트를 구하기 위해 헬퍼 함수 정의
  const getTraceStatus = (trace: RTMTrace) => {
    if (trace.mappedNodeIds.length === 0) {
      return {
        percent: 0,
        status: "omission" as const, // 구현 누락
        text: "구현 누락 (Omission)",
        color: "text-rose-400 border-rose-500/20 bg-rose-500/5",
        badge: "bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold",
      };
    }

    const totalNodes = trace.mappedNodeIds.length;
    const coveredNodes = trace.mappedNodeIds.filter((nodeId) => {
      const match = nodes.find((n) => n.id === nodeId);
      return match?.isCovered;
    }).length;

    const percent = Math.round((coveredNodes / totalNodes) * 100);

    if (percent === 100) {
      return {
        percent,
        status: "completed" as const, // 검증 완료
        text: "검증 완료 (Verified)",
        color: "text-emerald-400 border-emerald-900/20 bg-emerald-950/10 hover:border-emerald-800/40",
        badge: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 rounded-xs",
      };
    } else if (coveredNodes > 0) {
      return {
        percent,
        status: "partial" as const, // 부분 커버
        text: `검증 진행중 (${percent}%)`,
        color: "text-amber-400 border-amber-900/20 bg-amber-950/10 hover:border-amber-800/40",
        badge: "bg-amber-950/40 text-amber-400 border border-amber-900/30 rounded-xs",
      };
    } else {
      return {
        percent,
        status: "pending" as const, // 코드 미수행
        text: "코드 미검증 (Pending)",
        color: "text-stone-400 border-[#222] bg-[#0c0c0c]/40 hover:border-[#333]",
        badge: "bg-[#111] text-stone-400 border border-[#222] rounded-xs",
      };
    }
  };

  return (
    <div id="rtm-section" className="border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-5">
      <div className="flex items-center justify-between mb-4 border-b border-[#111] pb-3">
        <h3 className="text-sm font-sans text-[#A1824A] font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Requirements Traceability Matrix (RTM - 요구사항 일치율 검사)</span>
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">
          SDLC 기획 단계 정의 요구사항과 코드 매핑 정지점 시각화
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rtm.length === 0 ? (
          <div className="col-span-2 py-10 text-center text-stone-500 border border-dashed border-[#222] rounded-sm">
            <HelpCircle className="w-8 h-8 mx-auto stroke-[1.5px] text-stone-600 mb-2" />
            <p className="text-xs">
              소스 코드 분석이 완료되면 NLP 엔진이 자동으로 요구사항 매트릭스를 추출합니다.
            </p>
          </div>
        ) : (
          rtm.map((trace, index) => {
            const stats = getTraceStatus(trace);
            return (
              <motion.div
                id={`rtm-item-${trace.reqId}`}
                key={`rtm-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`relative flex flex-col justify-between border rounded-sm p-4 transition-all ${stats.color} ${
                  stats.status === "omission" ? "ring-1 ring-rose-950/30" : ""
                }`}
              >
                {/* Requirements Label and status badge */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-sm bg-[#111] border border-[#222]">
                      {trace.reqId}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 font-mono ${stats.badge}`}>
                      {stats.text}
                    </span>
                  </div>

                  <p className="text-xs text-stone-200 leading-normal mb-3 font-sans font-medium">
                    {trace.reqText}
                  </p>
                </div>

                {/* Mapped Node Buttons and Progress bar */}
                <div className="mt-2 pt-3 border-t border-[#111]/80">
                  <div className="flex justify-between items-center mb-2 text-[10px]">
                    <span className="text-gray-500 font-mono">Mapped CFG Nodes</span>
                    {stats.status !== "omission" && (
                      <span className="text-stone-300 font-mono">
                        {trace.mappedNodeIds.filter(id => nodes.find(n => n.id === id)?.isCovered).length} / {trace.mappedNodeIds.length} Nodes
                      </span>
                    )}
                  </div>

                  {stats.status === "omission" ? (
                    <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/15 border border-rose-900/35 px-2 py-1.5 rounded-sm text-[10px] w-full font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>위험: 이 기획 요구사항은 구현 코드 노드가 결손되었습니다!</span>
                    </div>
                  ) : (
                    <div>
                      {/* Flex array of small node badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {trace.mappedNodeIds.map((nodeId) => {
                          const n = nodes.find((node) => node.id === nodeId);
                          const isSel = nodeId === selectedNodeId;
                          const isCov = n?.isCovered;
                          return (
                            <button
                              id={`rtm-node-badge-${trace.reqId}-${nodeId}`}
                              key={nodeId}
                              onClick={() => onSelectNode(nodeId)}
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-xs flex items-center gap-1 cursor-pointer select-none transition-all ${
                                isSel ? "ring-1.5 ring-[#A1824A]" : ""
                              } ${
                                isCov
                                  ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950/35"
                                  : "bg-[#111111] text-stone-500 border border-[#222] hover:border-stone-700 hover:text-stone-400"
                              }`}
                            >
                              <span>N{nodeId}</span>
                              {isCov ? (
                                <span className="w-1.2 h-1.2 rounded-full bg-emerald-400 blink" />
                              ) : (
                                <span className="w-1.2 h-1.2 rounded-full bg-[#333]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Interactive Progress strip bar */}
                      <div className="w-full bg-[#111] h-1.5 rounded-xs overflow-hidden border border-[#222]/60">
                        <div
                          className={`h-full rounded-xs transition-all duration-500 ${
                            stats.status === "completed" ? "bg-emerald-600" : "bg-amber-600"
                          }`}
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
