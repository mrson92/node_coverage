import React, { useMemo } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar 
} from "recharts";
import { TrendingUp, AlertTriangle, ShieldAlert, CheckCircle, LineChart as ChartIcon } from "lucide-react";
import { motion } from "motion/react";

// 시계열 모의 분석 시나리오 데이터 셋 (수개월간의 릴리즈 추세)
const TIME_SERIES_DATA = [
  { release: "v1.0.0", coverage: 82, churn: 12, debt: 15, failureRate: 2 },
  { release: "v1.1.0", coverage: 80, churn: 18, debt: 18, failureRate: 4 },
  { release: "v1.2.0", coverage: 78, churn: 32, debt: 24, failureRate: 5 }, // Churn 급증, Coverage 하락 (Drift 시작)
  { release: "v1.3.0", coverage: 74, churn: 45, debt: 35, failureRate: 11 }, // Erosion 발생 (위험 신호)
  { release: "v1.4.0", coverage: 85, churn: 15, debt: 20, failureRate: 3 }, // 리팩토링 및 NC 회복
  { release: "v2.0.0 (최신)", coverage: 89, churn: 8, debt: 10, failureRate: 1 }, // 안정화 타겟 도달
];

export function TimeSeriesStats() {
  
  // 품질 저하 자가 진단 및 피드백 메시지 연산
  const alerts = useMemo(() => {
    const alertsList = [];
    
    // v1.2.0 -> v1.3.0 구간에서 발생한 Erosion(소프트웨어 침식) 분석
    alertsList.push({
      id: "alert-1",
      title: "소프트웨어 침식 감지 (Software Erosion Detected)",
      level: "critical" as const,
      description: "v1.2.0 ~ v1.3.0 릴리즈 주기에서 코드 수정 천(Churn) 비율이 45%로 최고점 도달 시, 노드 커버리지(NC)는 78%에서 74%로 급격히 드리프트(Drift, 침식) 하락했습니다. 이로 인해 운영 환경 변경 실패율이 5%에서 11%로 급증하는 기술 부채 동반 장애 현상이 목격되었습니다.",
    });

    alertsList.push({
      id: "alert-2",
      title: "위험: 코드 복잡성 임계 한도 초과 위험 노드 경고",
      level: "warning" as const,
      description: "순환 복잡성(Cyclomatic Complexity)이 높고 커버리지가 미흡한 미개발/미검증 VIP 바인딩 노드 구역이 발견되었습니다. AI 에이전트를 가동하여 기호 조건문을 분석하고 엣지 케이스 테스트를 선행 보정하는 것을 강력히 자문합니다.",
    });

    return alertsList;
  }, []);

  return (
    <div id="timeseries-section" className="grid grid-cols-1 xl:grid-cols-3 gap-6 border border-[#222] bg-[#0c0c0c]/80 rounded-sm p-5">
      
      {/* 1. Left charts: Coverage Drift vs Churn Trend */}
      <div className="xl:col-span-2 flex flex-col justify-between border border-[#222] bg-[#0c0c0c] rounded-sm p-5">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#111]">
            <h3 className="text-sm font-sans text-[#A1824A] font-semibold flex items-center gap-2">
              <ChartIcon className="w-4 h-4" />
              <span>릴리즈 주기별 침식 및 커버리지 드리프트 (Coverage Drift vs Churn)</span>
            </h3>
            <span className="text-[10px] text-gray-500 font-mono">시계열 정성/정량적 회귀 추이 분석</span>
          </div>

          <p className="text-xs text-gray-400 leading-normal mb-6 font-sans">
            코드가 변경되는 속도(Code Churn)와 노드 커버리지(NC)의 상반된 변화율을 분석하면, 
            품질 부채 및 시스템 아키텍처 결함 구역을 고속으로 검출할 수 있습니다.
          </p>

          {/* Recharts Area Container */}
          <div className="w-full h-[260px] text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={TIME_SERIES_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A1824A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#A1824A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.6} />
                <XAxis dataKey="release" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0c0c0c", 
                    borderColor: "#222",
                    color: "#e5e5e5"
                  }} 
                />
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  name="노드 커버리지 (NC) %" 
                  dataKey="coverage" 
                  stroke="#A1824A" 
                  fillOpacity={1} 
                  fill="url(#colorCoverage)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  name="코드 수정 천 (Churn) %" 
                  dataKey="churn" 
                  stroke="#d97706" 
                  fillOpacity={1} 
                  fill="url(#colorChurn)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center border-t border-[#111] pt-4 mt-2 font-sans">
          <div className="bg-[#080808]/40 p-2.5 rounded-sm border border-[#222]">
            <span className="text-[10px] text-gray-500 font-mono block mb-0.5">하락 한계선 (Warning Gate)</span>
            <span className="text-xs font-mono font-bold text-amber-500">NC 75.0%</span>
          </div>
          <div className="bg-[#080808]/40 p-2.5 rounded-sm border border-[#222]">
            <span className="text-[10px] text-gray-500 font-mono block mb-0.5">평균 Churn 대비 감쇠 지수</span>
            <span className="text-xs font-mono font-bold text-[#A1824A]">0.24 dS</span>
          </div>
          <div className="bg-[#080808]/40 p-2.5 rounded-sm border border-[#222]">
            <span className="text-[10px] text-gray-500 font-mono block mb-0.5">이직 회귀 최적화 성취 수치</span>
            <span className="text-xs font-mono font-bold text-emerald-400">1.8배 ~ 8.0배 단축</span>
          </div>
        </div>

      </div>

      {/* 2. Right Warning list check: Software Erosion monitoring rules */}
      <div className="flex flex-col gap-4 border border-[#222] bg-[#0c0c0c] rounded-sm p-5">
        <h4 className="text-xs font-sans text-gray-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Erosion & Technical Debt Auditor</span>
        </h4>

        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              id={alert.id}
              key={alert.id}
              className={`p-3.5 rounded-sm border flex gap-3 text-xs leading-normal font-sans transition-all hover:scale-[1.01] ${
                alert.level === "critical"
                  ? "bg-[#1f1212] border-rose-950/50 text-rose-300"
                  : "bg-[#1c1510] border-amber-950/40 text-amber-300"
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {alert.level === "critical" ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white">{alert.title}</span>
                <p className="text-[11px] text-gray-400 leading-relaxed font-normal">
                  {alert.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#111] rounded-sm p-3 border border-[#222] text-[11px] text-gray-400 flex items-center gap-2 font-sans">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>전 생애주기 품질 침식 감지가 정상 가동중입니다.</span>
        </div>
      </div>

    </div>
  );
}
