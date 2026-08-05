import React from "react";
import { 
  FileText, 
  Settings, 
  Play, 
  Cpu, 
  Check, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  ChevronsRight
} from "lucide-react";
import { motion } from "motion/react";

export interface WorkflowHUDProps {
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  analysisResultsPresent: boolean;
  simulationTriggered: boolean;
  optimizerTriggered: boolean;
}

export function WorkflowHUD({
  currentStep,
  onStepClick,
  analysisResultsPresent,
  simulationTriggered,
  optimizerTriggered
}: WorkflowHUDProps) {
  
  // Calculate recommended highlight step if user hasn't selected manually
  const detectedStep = React.useMemo(() => {
    if (optimizerTriggered) return 4;
    if (simulationTriggered) return 3;
    if (analysisResultsPresent) return 2;
    return 1;
  }, [analysisResultsPresent, simulationTriggered, optimizerTriggered]);

  const activeStep = currentStep || detectedStep;

  const steps = [
    {
      index: 1,
      title: "요건 & 소스 정의",
      subTitle: "RTM & Code Inputs",
      desc: "NLP 요구사항 규격과 평가 대상 원시 소스코드를 정의합니다.",
      icon: FileText,
      targetId: "source-code-editor",
    },
    {
      index: 2,
      title: "AST & CFG 정적 분석",
      subTitle: "Parser & Build Graph",
      desc: "코드 분할 그래프를 가공하고 도달 가능 커버리지 노드를 선언합니다.",
      icon: Settings,
      targetId: "cfg-section",
    },
    {
      index: 3,
      title: "동적 분기 시뮬레이션",
      subTitle: "Runtime Sandbox",
      desc: "실시간 테스트케이스 주입을 통해 수동/자동 상태 파격 동작을 모니터링합니다.",
      icon: Play,
      targetId: "simulation-section",
    },
    {
      index: 4,
      title: "AI 최적화 조율",
      subTitle: "Constraint Solver",
      desc: "인증 미도달 노드 및 제약 해결을 최첨단 에이전트로 해결합니다.",
      icon: Cpu,
      targetId: "ai-optimizer-section",
    },
  ];

  const handleScrollTo = (targetId: string, index: number) => {
    if (onStepClick) {
      onStepClick(index);
    }
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="border border-[#222] bg-[#0c0c0c] rounded-sm p-5 font-sans relative overflow-hidden" id="workflow-hud-container">
      {/* Decorative background grid line */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#A1824A]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header element */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 border-b border-[#111] gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-gray-500 block mb-0.5">Core SDLC Verification State</span>
          <h2 className="text-xs font-semibold text-stone-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A1824A] animate-pulse" />
            <span>노드 커버리지 검증 워크플로우 실시간 트래커 (Interactive Pipeline HUD)</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
          <span>Active Phase:</span>
          <span className="text-[#A1824A] font-bold bg-[#A1824A]/10 px-2 py-0.5 rounded-xs border border-[#A1824A]/20">
            {steps[activeStep - 1]?.title} (Step {activeStep}/4)
          </span>
        </div>
      </div>

      {/* Workflow Process Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = detectedStep > step.index;
          const isCurrent = activeStep === step.index;
          const StepIcon = step.icon;

          return (
            <div
              key={step.index}
              onClick={() => handleScrollTo(step.targetId, step.index)}
              className={`group flex flex-col justify-between p-3.5 rounded-sm border cursor-pointer transition-all duration-300 relative ${
                isCurrent
                  ? "bg-[#14120e] border-[#A1824A] text-white shadow-md shadow-[#A1824A]/5"
                  : isCompleted
                  ? "bg-[#080808]/60 border-emerald-950 text-stone-400 hover:border-[#A1824A]/40"
                  : "bg-[#080808]/20 border-[#222]/80 text-gray-500 hover:border-stone-800"
              }`}
              id={`workflow-step-${step.index}`}
            >
              {/* Connector lines (only visible on md+ screen layouts) */}
              {idx < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-gray-600 pointer-events-none group-hover:text-[#A1824A] transition-colors">
                  <ChevronsRight className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xs border transition-colors ${
                    isCurrent
                      ? "bg-[#A1824A]/25 border-[#A1824A]/40 text-[#A1824A]"
                      : isCompleted
                      ? "bg-emerald-950/20 border-emerald-900 text-emerald-400"
                      : "bg-[#111] border-[#222] text-gray-500"
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 block leading-none">STEP 0{step.index}</span>
                    <h3 className={`text-[11px] font-bold mt-0.5 ${isCurrent ? "text-stone-200" : "text-stone-400"}`}>
                      {step.title}
                    </h3>
                  </div>
                </div>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A1824A] blink" />
                )}
              </div>

              <div className="text-[10px] leading-relaxed mt-1 font-sans text-gray-500 group-hover:text-stone-400 transition-colors">
                {step.desc}
              </div>

              {/* Step completion percentage hint or active indicator */}
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#1a1a1a] text-[9px] font-mono">
                <span className="text-gray-600 group-hover:text-[#A1824A]/80 transition-colors uppercase">
                  {step.subTitle}
                </span>
                {isCurrent && (
                  <span className="text-[#A1824A] font-bold animate-pulse">● ACTIVE IN WORKSPACE</span>
                )}
                {isCompleted && (
                  <span className="text-emerald-500">✓ COMPLETED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
