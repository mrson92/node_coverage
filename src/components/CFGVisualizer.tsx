import React, { useState, useMemo } from "react";
import { CFGNode, CFGEdge } from "../types";
import { Play, HelpCircle, Activity, ShieldAlert, Minimize2, Search, X } from "lucide-react";
import { motion } from "motion/react";

interface CFGVisualizerProps {
  nodes: CFGNode[];
  edges: CFGEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onSimulateNodeExecution: (nodeId: string) => void;
  language: string;
  code?: string;
}

export function CFGVisualizer({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onSimulateNodeExecution,
  language,
  code,
}: CFGVisualizerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Find which nodes match the search query (case-insensitive)
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const query = searchQuery.toLowerCase().trim();
    const matches = nodes.filter(node => {
      const matchId = node.id.toLowerCase().includes(query);
      const matchLabel = node.label.toLowerCase().includes(query);
      const matchDesc = node.description.toLowerCase().includes(query);
      const matchType = node.type.toLowerCase().includes(query);
      return matchId || matchLabel || matchDesc || matchType;
    });
    return new Set(matches.map(n => n.id));
  }, [nodes, searchQuery]);

  const maxExecutionCount = useMemo(() => {
    const counts = nodes.map(n => n.executionCount || 0);
    return Math.max(...counts, 1);
  }, [nodes]);

  // Floating hover stats for on-the-fly nodes inspection
  const [hoveredNode, setHoveredNode] = useState<CFGNode | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  // Memoized exact sliced code snippet targeting line offsets safely
  const hoveredCodeSnippet = useMemo(() => {
    if (!hoveredNode || !code) return null;
    try {
      const lines = code.split("\n");
      const start = Math.max(0, hoveredNode.lineStart - 1);
      const end = Math.min(lines.length - 1, hoveredNode.lineEnd - 1);
      if (start <= end) {
        return lines.slice(start, end + 1).join("\n");
      }
    } catch (e) {
      // safe fallback
    }
    return null;
  }, [code, hoveredNode]);

  // 1. 단순화된 계층 배치(Node Positioning Layout Engine)
  // 노드 개수가 가변적이므로, 레벨(y축) 및 브랜치(x축)의 좌표를 지능적으로 배포합니다.
  const structuredLayout = useMemo(() => {
    if (nodes.length === 0) return new Map<string, { x: number; y: number }>();

    const positions = new Map<string, { x: number; y: number }>();

    // 너비와 높이 영역 설정
    const width = 450;
    const height = 480;

    // BFS를 통하여 각 노드의 Depth를 측정합니다.
    const depthMap = new Map<string, number>();
    const visited = new Set<string>();
    
    // start 노드를 루트로 설정
    const starts = nodes.filter(n => n.type === 'start' || n.id.toLowerCase().includes('start') || n.id.toLowerCase().includes('node1') || n.id === '1');
    const startNode = starts[0] || nodes[0];
    
    const queue: { id: string; depth: number }[] = [{ id: startNode.id, depth: 0 }];
    visited.add(startNode.id);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      depthMap.set(id, depth);

      // 나가는 에지 찾기
      const outEdges = edges.filter(e => e.source === id);
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push({ id: edge.target, depth: depth + 1 });
        }
      }
    }

    // 미방문 노드들은 최대 뎁스 + 1 로 처리
    const maxAssignedDepth = Array.from(depthMap.values()).reduce((max, d) => Math.max(max, d), 0);
    nodes.forEach(n => {
      if (!depthMap.has(n.id)) {
        depthMap.set(n.id, maxAssignedDepth + 1);
      }
    });

    // 각 depth별 노드 리스크 구룹화
    const depthGroups = new Map<number, string[]>();
    nodes.forEach(n => {
      const d = depthMap.get(n.id) || 0;
      if (!depthGroups.has(d)) depthGroups.set(d, []);
      depthGroups.get(d)!.push(n.id);
    });

    const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
    const stepY = height / Math.max(sortedDepths.length, 1);

    sortedDepths.forEach((depth, dIdx) => {
      const group = depthGroups.get(depth)!;
      const stepX = width / (group.length + 1);
      const y = 40 + dIdx * (height - 80) / Math.max(sortedDepths.length - 1, 1);

      group.forEach((nodeId, nIdx) => {
        const x = stepX * (nIdx + 1);
        positions.set(nodeId, { x, y: isNaN(y) ? 240 : y });
      });
    });

    return positions;
  }, [nodes, edges]);

  // SVG 제어기 인터랙션
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // 배경을 클릭했을 때만 드래그 처리
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).id === "bg-grid") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
    setZoom(Math.min(Math.max(newZoom, 0.4), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Helper to determine edge branch type (True versus False path)
  const getEdgeBranchType = (edge: CFGEdge, sourceNode?: CFGNode): "true" | "false" | "none" => {
    if (!sourceNode || sourceNode.type !== "decision") {
      return "none";
    }
    if (!edge.condition) {
      return "none";
    }
    const cond = edge.condition.toLowerCase();
    
    // Positive matching conditions
    if (
      cond.includes("approved") ||
      cond.includes("success") ||
      cond.includes("ok") ||
      cond.includes("normal") ||
      cond.includes("authorized") ||
      cond.includes("true") ||
      cond === "yes" ||
      cond === "t" ||
      cond.includes(">=") ||
      cond.includes(">") ||
      cond.includes("vip") ||
      cond.includes("stdout") ||
      cond.includes("stock ok")
    ) {
      return "true";
    }

    // Negative matching conditions
    if (
      cond.includes("declined") ||
      cond.includes("fail") ||
      cond.includes("error") ||
      cond.includes("fatal") ||
      cond.includes("no") ||
      cond.includes("false") ||
      cond === "rejected" ||
      cond === "f" ||
      cond.includes("<=") ||
      cond.includes("<") ||
      cond.includes("basic") ||
      cond.includes("file") ||
      cond.includes("no stock")
    ) {
      return "false";
    }

    return "none";
  };

  // Compute incoming True/False path roles for each node to determine target border style
  const incomingTrueFalseRole = useMemo(() => {
    const roles = new Map<string, "true" | "false" | "none" | "mixed">();
    nodes.forEach(node => {
      const incoming = edges.filter(e => e.target === node.id);
      let trueCount = 0;
      let falseCount = 0;
      incoming.forEach(edge => {
        const srcNode = nodes.find(n => n.id === edge.source);
        const branchType = getEdgeBranchType(edge, srcNode);
        if (branchType === "true") trueCount++;
        if (branchType === "false") falseCount++;
      });

      if (trueCount > 0 && falseCount > 0) {
        roles.set(node.id, "mixed");
      } else if (trueCount > 0) {
        roles.set(node.id, "true");
      } else if (falseCount > 0) {
        roles.set(node.id, "false");
      } else {
        roles.set(node.id, "none");
      }
    });
    return roles;
  }, [nodes, edges]);

  // SVG 내 렌더링에 필요한 형태 및 색상 설정
  const getNodeColorClass = (node: CFGNode) => {
    const isSel = node.id === selectedNodeId;
    const role = incomingTrueFalseRole.get(node.id) || "none";
    
    // Determine custom stroke style based on True / False path role
    let strokeClass = "";
    let dasharray: string | undefined = undefined;
    let strokeWidthClass = "stroke-[2px]";
    
    if (isSel) {
      strokeClass = "stroke-[#A1824A]";
      strokeWidthClass = "stroke-[2.5px]";
    } else if (node.isCovered) {
      if (role === "false") {
        strokeClass = "stroke-amber-500/80";
      } else if (role === "true") {
        strokeClass = "stroke-emerald-500/90";
      } else {
        strokeClass = "stroke-emerald-600/80";
      }
    } else if (node.reachability === "unreachable") {
      strokeClass = "stroke-rose-850";
    } else {
      if (role === "false") {
        strokeClass = "stroke-rose-700/60";
      } else if (role === "true") {
        strokeClass = "stroke-emerald-700/60";
      } else {
        strokeClass = "stroke-[#2b2b2b]";
      }
    }

    if (role === "false") {
      dasharray = "4,3";
    }

    if (heatmapEnabled) {
      const execCount = node.executionCount || 0;
      const ratio = maxExecutionCount > 0 ? execCount / maxExecutionCount : 0;
      
      let heatStroke = "stroke-slate-800/40";
      let heatFill = "fill-slate-950/70";
      let heatShadow = "shadow-none";
      let heatText = "text-stone-500";
      
      if (isSel) {
        heatStroke = "stroke-[#A1824A]";
        heatFill = "fill-slate-900/95";
        heatShadow = "drop-shadow-[0_0_8px_rgba(161,130,74,0.4)]";
        heatText = "text-stone-300";
      } else if (execCount > 0) {
        if (ratio <= 0.3) {
          // Cold node (Teal/Cyan)
          heatStroke = "stroke-teal-500/80";
          heatFill = "fill-teal-950/20";
          heatShadow = "drop-shadow-[0_0_6px_rgba(20,184,166,0.25)]";
          heatText = "text-teal-400";
        } else if (ratio <= 0.7) {
          // Warm node (Amber/Orange)
          heatStroke = "stroke-amber-500/90";
          heatFill = "fill-amber-950/25";
          heatShadow = "drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]";
          heatText = "text-amber-400";
        } else {
          // Hot node (Brilliant Rose/Red)
          heatStroke = "stroke-rose-500";
          heatFill = "fill-rose-950/35";
          heatShadow = "drop-shadow-[0_0_12px_rgba(244,63,94,0.55)]";
          heatText = "text-rose-400 font-bold";
        }
      } else if (node.reachability === "unreachable") {
        heatStroke = "stroke-rose-950/40";
        heatFill = "fill-rose-995/5";
        heatText = "text-rose-950/40";
      }
      
      return {
        fill: heatFill,
        stroke: heatStroke,
        strokeWidth: strokeWidthClass,
        strokeDasharray: dasharray,
        shadow: heatShadow,
        text: heatText
      };
    }

    if (node.isCovered) {
      return {
        fill: "fill-emerald-500/10",
        stroke: strokeClass,
        strokeWidth: strokeWidthClass,
        strokeDasharray: dasharray,
        shadow: isSel ? "drop-shadow-[0_0_8px_rgba(161,130,74,0.5)]" : "drop-shadow-[0_0_6px_rgba(16,185,129,0.25)]",
        text: "text-emerald-300"
      };
    }
    if (node.reachability === "unreachable") {
      return {
        fill: "fill-rose-950/20",
        stroke: strokeClass,
        strokeWidth: strokeWidthClass,
        strokeDasharray: dasharray,
        shadow: isSel ? "drop-shadow-[0_0_8px_rgba(161,130,74,0.5)]" : "drop-shadow-[0_0_6px_rgba(244,63,94,0.15)]",
        text: "text-rose-400"
      };
    }
    
    return {
      fill: "fill-[#111111]/90",
      stroke: strokeClass,
      strokeWidth: strokeWidthClass,
      strokeDasharray: dasharray,
      shadow: isSel ? "drop-shadow-[0_0_8px_rgba(161,130,74,0.4)]" : "drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]",
      text: role === "true" ? "text-emerald-400" : role === "false" ? "text-rose-400" : "text-stone-400"
    };
  };

  const isSearchActive = searchQuery.trim() !== "";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search & Statistics Bar above the CFG Graph View */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#A1824A]" />
            <span className="text-xs font-sans tracking-wide text-stone-200 font-bold uppercase">CFG Node Finder</span>
          </div>
          <p className="text-[10px] text-gray-500">
            Search by Node ID, label description, statement keywords, or node type (e.g. decision, start)
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real Input field */}
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Filter nodes... (e.g., N2, approved, success)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050505] text-xs text-stone-200 placeholder-stone-600 rounded-sm py-2 pl-8 pr-8 border border-[#222] hover:border-[#333] focus:border-[#A1824A] focus:outline-none transition-colors duration-150"
            />
            <div className="absolute left-2.5 top-2.5 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-stone-600" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 p-0.5 text-stone-500 hover:text-stone-300 rounded-full cursor-pointer bg-transparent border-none outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Statistics or Match Indicators */}
          {isSearchActive && (
            <div className="text-[11px] font-mono font-bold bg-[#1d160e] text-[#A1824A] border border-[#A1824A]/30 px-3 py-1.5 rounded-sm animate-fadeIn">
              {matchingNodeIds.size === 0 ? "NO MATCHES" : `${matchingNodeIds.size} MATCH${matchingNodeIds.size > 1 ?'ES':''} FOUND`}
            </div>
          )}
        </div>
      </div>

      <div id="cfg-section" className="flex flex-col lg:flex-row gap-6 border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-4">
      
      {/* 1. Left interactive SVG Graph Board */}
      <div className="flex-1 flex flex-col justify-between h-[510px] relative border border-[#222] bg-[#080808] rounded-sm overflow-hidden">
        {/* Top Header Controls */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#080808]/95 border border-[#222] text-xs text-stone-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-[#A1824A] blink" />
            <span>Interactive CFG ({nodes.length} Nodes)</span>
          </div>
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              title="Toggle Heatmap"
              className={`px-2.5 py-1 text-[11px] font-mono border rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                heatmapEnabled
                  ? "bg-rose-950/40 text-rose-400 border-rose-800/60 font-bold shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                  : "bg-[#111] text-stone-400 hover:bg-[#1c1c1c] border border-[#222]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${heatmapEnabled ? "bg-rose-500 animate-ping" : "bg-stone-650"}`}></span>
              Heatmap: {heatmapEnabled ? "ON" : "OFF"}
            </button>
            <button
              onClick={resetView}
              title="Reset Zoom"
              className="px-2.5 py-1 text-[11px] font-mono text-stone-400 bg-[#111] hover:bg-[#1c1c1c] border border-[#222] rounded-sm transition-colors cursor-pointer"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Dynamic Zoom Indicator */}
        <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-500 z-10 select-none">
          Zoom: {Math.round(zoom * 100)}% | Drag background to pan | Scroll to zoom
        </div>

        {/* Graphical SVG Viewport */}
        <svg
          id="cfg-board-svg"
          className="w-full h-full cursor-grab active:cursor-grabbing select-none font-sans"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* SVG Background grids */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect id="bg-grid" width="100%" height="100%" fill="url(#grid)" />

          {/* Group containing zoom and pan translation offset transform */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {/* Draw Edges */}
            {edges.map((edge, index) => {
              const startPos = structuredLayout.get(edge.source);
              const endPos = structuredLayout.get(edge.target);
              if (!startPos || !endPos) return null;

              // Check if selected edge
              const isSelectedSource = edge.source === selectedNodeId;
              const isSelectedTarget = edge.target === selectedNodeId;
              const isSourceCovered = nodes.find(n => n.id === edge.source)?.isCovered;
              const isTargetCovered = nodes.find(n => n.id === edge.target)?.isCovered;
              
              const isHighlighted = isSelectedSource || isSelectedTarget;
              const isFlowingActive = isSourceCovered && isTargetCovered;

              const srcNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              const branchType = getEdgeBranchType(edge, srcNode);

              const isHeatActive = heatmapEnabled && srcNode?.isCovered && targetNode?.isCovered;
              const edgeExecutionCount = isHeatActive ? Math.min(srcNode.executionCount || 0, targetNode.executionCount || 0) : 0;
              const edgeRatio = maxExecutionCount > 0 ? (edgeExecutionCount / maxExecutionCount) : 0;

              // Customize path attributes dynamically
              let pathColor = isFlowingActive 
                ? "stroke-emerald-600/80" 
                : branchType === "true"
                ? "stroke-emerald-700/60"
                : branchType === "false"
                ? "stroke-rose-700/65"
                : isHighlighted 
                ? "stroke-[#A1824A]" 
                : "stroke-stone-800";
              let pathWidth = isHighlighted ? "2.5" : "1.5";
              let dotColor = isFlowingActive ? "#10b981" : isHighlighted ? "#A1824A" : "#2e2e2e";
              let dashArray: string | undefined = isFlowingActive ? "5,5" : undefined;

              if (heatmapEnabled) {
                if (!isHeatActive) {
                  pathColor = "stroke-stone-900/40";
                  pathWidth = "1.0";
                  dotColor = "#121212";
                  dashArray = undefined;
                } else {
                  if (edgeRatio <= 0.3) {
                    pathColor = "stroke-teal-500/80";
                    pathWidth = "2.0";
                    dotColor = "#14b8a6";
                    dashArray = "6,4";
                  } else if (edgeRatio <= 0.7) {
                    pathColor = "stroke-amber-500";
                    pathWidth = "2.8";
                    dotColor = "#f59e0b";
                    dashArray = "5,3";
                  } else {
                    pathColor = "stroke-rose-500";
                    pathWidth = "3.8";
                    dotColor = "#f43f5e";
                    dashArray = "4,2";
                  }
                }
              }

              // Curve bezier calculator
              const dx = endPos.x - startPos.x;
              const dy = endPos.y - startPos.y;
              const cx1 = startPos.x;
              const cy1 = startPos.y + dy * 0.5;
              const cx2 = endPos.x;
              const cy2 = startPos.y + dy * 0.4;

              const pathData = `M ${startPos.x} ${startPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endPos.x} ${endPos.y}`;

              // Calculate point at t = 0.25 along the bezier curve for branch T/F markers (to prevent overlaps)
              const tBadge = 0.25;
              const mtB = 1 - tBadge;
              const mtB2 = mtB * mtB;
              const mtB3 = mtB2 * mtB;
              const tB2 = tBadge * tBadge;
              const tB3 = tB2 * tBadge;
              const markerX = mtB3 * startPos.x + 3 * mtB2 * tBadge * cx1 + 3 * mtB * tB2 * cx2 + tB3 * endPos.x;
              const markerY = mtB3 * startPos.y + 3 * mtB2 * tBadge * cy1 + 3 * mtB * tB2 * cy2 + tB3 * endPos.y;

              // Calculate point at t = 0.70 along the bezier curve for edge conditions (to prevent overlaps)
              const tCond = 0.70;
              const mtC = 1 - tCond;
              const mtC2 = mtC * mtC;
              const mtC3 = mtC2 * mtC;
              const tC2 = tCond * tCond;
              const tC3 = tC2 * tCond;
              const condX = mtC3 * startPos.x + 3 * mtC2 * tCond * cx1 + 3 * mtC * tC2 * cx2 + tC3 * endPos.x;
              const condY = mtC3 * startPos.y + 3 * mtC2 * tCond * cy1 + 3 * mtC * tC2 * cy2 + tC3 * endPos.y;

              const isSourceMatch = matchingNodeIds.has(edge.source);
              const isTargetMatch = matchingNodeIds.has(edge.target);
              const dimEdge = isSearchActive && !isSourceMatch && !isTargetMatch;

              return (
                <g 
                  key={`edge-${index}`}
                  className={`transition-opacity duration-300 ${dimEdge ? "opacity-[0.12] scale-95" : "opacity-100"}`}
                >
                  {/* Outer edge glow */}
                  {isHighlighted && (
                    <path
                      d={pathData}
                      fill="none"
                      className="stroke-[#A1824A]/25"
                      strokeWidth="6"
                    />
                  )}
                  {/* Dynamic running flow dash array when covered */}
                  <path
                    d={pathData}
                    fill="none"
                    className={`${pathColor} transition-all duration-300`}
                    strokeWidth={pathWidth}
                    strokeDasharray={dashArray}
                  />

                  {/* Tiny Marker/Arrow on targeting node */}
                  <circle cx={endPos.x} cy={endPos.y - 14} r="3" fill={dotColor} />
                  
                  {/* Dynamic branch indicator badge */}
                  {branchType !== "none" && (
                    <g transform={`translate(${markerX}, ${markerY})`}>
                      {/* Backdrops with color themes */}
                      <rect
                        x="-23"
                        y="-9.5"
                        width="46"
                        height="19"
                        rx="9.5"
                        className={
                          branchType === "true"
                            ? "fill-emerald-950/95 stroke-emerald-500/90"
                            : "fill-rose-950/95 stroke-rose-500/90"
                        }
                        strokeWidth="1.2"
                      />
                      {/* Little decorator dot on the left side of pill */}
                      <circle
                        cx="-14"
                        cy="0"
                        r="2.5"
                        className={branchType === "true" ? "fill-emerald-400 animate-pulse" : "fill-rose-400"}
                      />
                      {/* Detailed label text with perfect vertical center (fill="currentColor" fixes black text issue) */}
                      <text
                        x="5"
                        y="3"
                        textAnchor="middle"
                        fill="currentColor"
                        className={`font-sans font-extrabold text-[9px] select-none pointer-events-none tracking-wider ${
                          branchType === "true" ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {branchType === "true" ? "TRUE" : "FALSE"}
                      </text>
                    </g>
                  )}

                  {/* Edge conditional annotation trigger (rendered at condX/condY along the bezier path to prevent overlap) */}
                  {edge.condition && (
                    <foreignObject
                      x={condX - 40}
                      y={condY - 10}
                      width="80"
                      height="20"
                    >
                      <div className="flex justify-center">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-sm bg-[#0c0c0c] text-[#A1824A] border border-[#222] shadow-md max-w-full truncate">
                          {edge.condition}
                        </span>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const pos = structuredLayout.get(node.id);
              if (!pos) return null;

              const c = getNodeColorClass(node);
              const isSel = node.id === selectedNodeId;

              // Shape by Node classification
              let nodeShape = null;
              if (node.type === "start" || node.type === "end") {
                nodeShape = (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    strokeDasharray={c.strokeDasharray}
                    className={`${c.fill || "fill-slate-950/90"} ${c.stroke} ${c.strokeWidth} cursor-pointer transition-all ${c.shadow}`}
                  />
                );
              } else if (node.type === "decision") {
                // Dimond shape
                const size = 16;
                const points = `${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`;
                nodeShape = (
                  <polygon
                    points={points}
                    strokeDasharray={c.strokeDasharray}
                    className={`${c.fill || "fill-slate-950/90"} ${c.stroke} ${c.strokeWidth} cursor-pointer transition-all ${c.shadow}`}
                  />
                );
              } else {
                // Rect shape (basic / call node)
                nodeShape = (
                  <rect
                    x={pos.x - 22}
                    y={pos.y - 12}
                    width="44"
                    height="24"
                    rx={node.type === "call" ? "8" : "3"}
                    strokeDasharray={c.strokeDasharray}
                    className={`${c.fill || "fill-slate-950/90"} ${c.stroke} ${c.strokeWidth} cursor-pointer transition-all ${c.shadow}`}
                  />
                );
              }

              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredNode(node);
                    const container = e.currentTarget.closest(".relative");
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      setHoveredPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const container = e.currentTarget.closest(".relative");
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      setHoveredPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                  }}
                  className={`group cursor-pointer select-none transition-all duration-300 ${
                    isSearchActive
                      ? matchingNodeIds.has(node.id)
                        ? "opacity-100 scale-105 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                        : "opacity-25 contrast-75 blur-[0.3px]"
                      : "opacity-100"
                  }`}
                >
                  {/* Search Match Highlight Halo */}
                  {isSearchActive && matchingNodeIds.has(node.id) && (
                    <>
                      {/* Glowing wide outer bloom */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="31"
                        fill="none"
                        className="stroke-amber-500/20 fill-amber-500/5 animate-pulse stroke-[4px]"
                      />
                      {/* Distinct dashed high-fidelity outline to guide the eye */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="25"
                        fill="none"
                        className="stroke-amber-400/90 stroke-[1.5px]"
                        strokeDasharray="4,3"
                      />
                    </>
                  )}

                  {/* Selection Indicator highlight ring */}
                  {isSel && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="26"
                      fill="none"
                      className="stroke-[#A1824A]/40 animate-pulse stroke-[1.5px]"
                    />
                  )}

                  {nodeShape}

                  {/* Inner Label code text (fill="currentColor" fixes black text issue) */}
                  <text
                    x={pos.x}
                    y={pos.y + 3.5}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-stone-200 text-[10px] font-mono font-bold select-none cursor-pointer"
                  >
                    N{node.id}
                  </text>

                  {/* Covered count mini circle indicator */}
                  {node.isCovered && (node.executionCount || 0) > 0 && (
                    <g transform={`translate(${pos.x + 13}, ${pos.y - 13})`}>
                      <circle r="7.5" className="fill-emerald-600 stroke-[#080808] stroke-[1.5px]" />
                      {/* fill="currentColor" fixes black text issue */}
                      <text
                        y="2.5"
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-white font-mono font-bold text-[8px]"
                      >
                        {node.executionCount}
                      </text>
                    </g>
                  )}

                  {/* Bottom Text Label (fill="currentColor" fixes black text issue) */}
                  <text
                    x={pos.x}
                    y={pos.y + (node.type === "decision" ? 28 : 26)}
                    textAnchor="middle"
                    fill="currentColor"
                    className={`font-semibold text-[9px] pointer-events-none select-none tracking-tight ${c.text}`}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Node Tooltip */}
        {hoveredNode && hoveredPos && (
          <div
            className="absolute pointer-events-none z-50 bg-[#0e0e0e]/95 border border-[#A1824A]/70 rounded-md p-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col gap-2 max-w-[290px] text-left transition-all duration-75"
            style={{
              left: `${Math.min(hoveredPos.x + 15, 340)}px`,
              top: `${Math.min(hoveredPos.y + 15, 305)}px`,
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-[#222] pb-1.5 gap-2">
              <span className="font-mono text-[11px] font-bold text-stone-200">
                Node N{hoveredNode.id}
              </span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-xs font-bold leading-none ${
                hoveredNode.isCovered ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" : "bg-stone-900 text-stone-400 border border-stone-850"
              }`}>
                {hoveredNode.isCovered ? `${hoveredNode.executionCount || 1} HITS (COVERED)` : "UNCOVERED"}
              </span>
            </div>

            {/* Label & Description */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-sans font-bold text-[#A1824A] leading-tight">{hoveredNode.label}</span>
              <p className="text-[9px] text-gray-400 leading-snug">{hoveredNode.description}</p>
            </div>

            {/* Code Snippet block */}
            <div className="mt-1 flex flex-col gap-1">
              <span className="text-[8px] font-mono text-gray-500 uppercase">Associated Code Snippet (Lines {hoveredNode.lineStart}-{hoveredNode.lineEnd}):</span>
              <div className="bg-[#050505] border border-[#1b1b1b] rounded-xs p-2 max-h-[140px] overflow-hidden">
                {hoveredCodeSnippet ? (
                  <pre className="font-mono text-[9px] leading-relaxed text-[#D4D4D4] whitespace-pre-wrap select-none overflow-x-auto">
                    {hoveredCodeSnippet}
                  </pre>
                ) : (
                  <span className="font-mono text-[9px] italic text-gray-600 block">
                    No active source mapping loaded.
                  </span>
                )}
              </div>
            </div>
            
            {/* Reachability specs footer */}
            <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 border-t border-[#1a1a1a] pt-1.5 mt-0.5 animate-fadeIn">
              <span>Type: {hoveredNode.type.toUpperCase()}</span>
              <span className={hoveredNode.reachability === 'reachable' ? 'text-emerald-500' : 'text-amber-500'}>
                {hoveredNode.reachability.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Heatmap Legend Overlay when active */}
        {heatmapEnabled && (
          <div className="absolute bottom-3 right-4 bg-[#0a0a09]/95 border border-[#222] rounded-sm py-1.5 px-2.5 text-[10px] font-mono text-stone-400 z-10 select-none flex flex-col gap-1 shadow-lg pointer-events-none transition-all animate-fadeIn">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider scale-95 origin-left">Heatmap Gradient</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[#1a202c] rounded-xs border border-slate-800"></span>
                <span>0 hits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-teal-500 rounded-xs"></span>
                <span>Low (&le;30%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-amber-500 rounded-xs"></span>
                <span>Mid (31%-70%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-rose-500 rounded-xs"></span>
                <span>Hot (&gt;70%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Right selected Node static info sheet */}
      <div className="w-full lg:w-[350px] flex flex-col justify-between border border-[#222] bg-[#0c0c0c] rounded-sm p-5">
        <div>
          <h3 className="text-sm font-sans tracking-wide text-[#A1824A] font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Node Metadata Inspector</span>
          </h3>

          {selectedNode ? (
            <div className="flex flex-col gap-4">
              {/* Basic Node Badge Row */}
              <div className="flex flex-col gap-1.5 pb-3 border-b border-[#1c1c1c]">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-serif italic text-white leading-none">Node N{selectedNode.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold tracking-wide uppercase ${
                    selectedNode.type === "start" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" :
                    selectedNode.type === "decision" ? "bg-amber-950/40 text-amber-400 border border-amber-900/40" :
                    selectedNode.type === "end" ? "bg-rose-950/40 text-rose-400 border border-rose-900/40" :
                    "bg-[#161616] text-[#A1824A] border border-[#222]"
                  }`}>
                    {selectedNode.type.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-[#E5E5E5] font-medium">{selectedNode.label}</span>
              </div>

              {/* Status Spec */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#111] p-2.5 rounded-sm border border-[#222]">
                  <span className="text-gray-500 text-[10px] block font-mono">Covered Count</span>
                  <span className={`font-mono text-sm font-bold ${selectedNode.isCovered ? "text-emerald-400" : "text-stone-500"}`}>
                    {selectedNode.executionCount || 0} hit(s)
                  </span>
                </div>
                <div className="bg-[#111] p-2.5 rounded-sm border border-[#222]">
                  <span className="text-gray-500 text-[10px] block font-mono">Reachability</span>
                  <span className={`font-mono text-sm font-bold ${
                    selectedNode.reachability === "reachable" ? "text-emerald-400" :
                    selectedNode.reachability === "conditional" ? "text-amber-400" : "text-rose-500"
                  }`}>
                    {selectedNode.reachability.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Description summary */}
              <div>
                <span className="text-gray-500 text-[10px] font-mono block mb-1">Code block logic summary</span>
                <p className="text-xs text-stone-300 leading-relaxed bg-[#111]/60 p-2.5 rounded-sm border border-[#222]">
                  {selectedNode.description}
                </p>
              </div>

              {/* Language specific aspect summary */}
              {selectedNode.languageSpecificAspect && (
                <div className="bg-[#1a150e] border border-[#A1824A]/20 p-2.5 rounded-sm text-xs border-l-[3px] border-l-[#A1824A]">
                  <span className="text-[#A1824A] text-[10px] font-mono block mb-1">Language Specific Analysis Insight</span>
                  <span className="text-stone-300 leading-normal block text-[11px]">
                    {selectedNode.languageSpecificAspect}
                  </span>
                </div>
              )}

              {/* Lines coverage status */}
              <div className="bg-[#111]/40 border border-[#222] rounded-sm p-2 text-xs flex justify-between font-mono">
                <span className="text-gray-500 text-[10px]">Lines range</span>
                <span className="text-stone-300">Lines {selectedNode.lineStart} - {selectedNode.lineEnd}</span>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
              <HelpCircle className="w-10 h-10 stroke-[1.5px] text-stone-600 mb-2" />
              <p className="text-xs">
                CFG 그래프의 노드를 선택하시면<br />
                정밀 구조적 정보와 바인딩 지표를<br />
                인스펙트할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="mt-4 pt-3 border-t border-[#1c1c1c]">
            <button
              id={`simulate-execution-btn-${selectedNode.id}`}
              onClick={() => onSimulateNodeExecution(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#1c1c1c] text-[#A1824A] border border-[#A1824A]/40 text-xs font-bold rounded-sm cursor-pointer transition-all hover:scale-[1.01]"
            >
              <Play className="w-3.5 h-3.5 fill-[#A1824A] text-[#A1824A]" />
              <span>로컬 모의 실행 (Hit 노드)</span>
            </button>
          </div>
        )}
      </div>

    </div>
  </div>
);
}
