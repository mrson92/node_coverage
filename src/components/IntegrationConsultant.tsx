import React, { useState } from "react";
import { 
  Bot, 
  User, 
  ArrowRight, 
  RotateCcw, 
  Copy, 
  Check, 
  GitBranch, 
  Code2, 
  Cpu, 
  Terminal, 
  GitPullRequest, 
  Database,
  ExternalLink,
  Github,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  FileCode2,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// 생성된 Blueprint가 실제 구동 중인 앱 endpoint를 가리키도록 동적 origin 사용
const APP_BASE =
  typeof window !== "undefined" ? window.location.origin : "https://node-coverage-analyzer.example";
const ANALYZE_ENDPOINT = `${APP_BASE}/api/analyze`;
const API_ROOT = `${APP_BASE}/api`;

interface Answer {
  q1: string | null; // Intake option
  q2: string | null; // Trigger option
  q3: string | null; // Requirements option
}

export function IntegrationConsultant() {
  const [step, setStep] = useState<number>(0); // 0: Intro, 1: Q1, 2: Q2, 3: Q3, 4: Results
  const [answers, setAnswers] = useState<Answer>({
    q1: null,
    q2: null,
    q3: null,
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [customMsg, setCustomMsg] = useState<string>("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { 
      sender: "bot", 
      text: "안녕하십니까! 저는 Node Coverage 시스템 아키텍트입니다. 로컬 원가 코드를 대시보드에 업로드하거나 관리하는 무거운 진입 장벽을 완전히 걷어내고, 편리하게 SDLC를 가공하는 맞춤형 연동 방안을 진치적으로 도출해보겠습니다." 
    }
  ]);

  const q1Options = [
    {
      id: "GitRepo",
      title: "GitHub Webhook / Actions 연동",
      desc: "지정한 브랜치의 변경 사항을 감지하여 실시간 제어 노드로 소스코드를 자동 주입합니다.",
      icon: Github,
    },
    {
      id: "VSCode",
      title: "IDE 확장 플러그인 (VS Code Extension)",
      desc: "개발자가 코드를 작성하는 로컬 에디터에서 원격으로 활성 소스코드를 파싱 후 미토그 피드백을 수취합니다.",
      icon: Code2,
    },
    {
      id: "CIProbe",
      title: "CI/CD 배시 프로브 (CLI Daemon Agent)",
      desc: "Jenkins, GitLab Runner 에서 단순 curl 명령 한 줄로 소스 및 AST 구조를 실시간 전달하는 빌드 스텝 삽입 형태입니다.",
      icon: Terminal,
    },
  ];

  const q2Options = [
    {
      id: "OnCommit",
      title: "코드 Push / Commit 시점 자동 트리거",
      desc: "코드 변경 시마다 무정지 무차단 품질 평가 루틴이 작동하며, 커버리지 등락 트렌드 분석에 최적입니다.",
      icon: GitBranch,
    },
    {
      id: "OnPR",
      title: "Pull Request (PR) 가동 검열 심사",
      desc: "병합하기 전 사전 유효성 심사 게이트를 통과하도록 제약하며 코드 위생 상태 보증서로 활용됩니다.",
      icon: GitPullRequest,
    },
    {
      id: "OnSchedule",
      title: "스케줄 온디맨드 (Daily Batch / Nightly Build)",
      desc: "서버가 한가한 시간대나 매일 자정에 전체 레파지토리 커버리지와 기술 부채를 통계 산적 수집합니다.",
      icon: Layers,
    },
  ];

  const q3Options = [
    {
      id: "JiraDocs",
      title: "Jira / Confluence 티켓 자동 바인딩",
      desc: "Epic 및 User Story 티켓의 명세를 지능형 역구문 분석하여 NLP 요건 Spec 시각으로 동적 매핑합니다.",
      icon: Database,
    },
    {
      id: "CodeDocstring",
      title: "코드 인라인 주석 (Docstring / Annotation) 추출",
      desc: "클래스/함수 상단에 작성된 자바독, PyDoc 내의 특수 명세 데코레이터를 추적 수집하여 일치성을 대조 검증합니다.",
      icon: FileCode2,
    },
    {
      id: "ManualAssist",
      title: "지능형 NLP 요건 조율 마법사 동반 사용",
      desc: "대시보드의 프롬프트 조율기를 통해 요구사항 매니저가 유연한 테스트 설계를 가독 조절합니다.",
      icon: Cpu,
    },
  ];

  const handleAnswer = (questionIndex: 1 | 2 | 3, value: string, textSummary: string) => {
    // Audit response logs
    const newAnswers = { ...answers };
    if (questionIndex === 1) newAnswers.q1 = value;
    if (questionIndex === 2) newAnswers.q2 = value;
    if (questionIndex === 3) newAnswers.q3 = value;
    setAnswers(newAnswers);

    // Update Chat History visually
    setChatLog((prev) => [
      ...prev,
      { sender: "user", text: textSummary },
      { 
        sender: "bot", 
        text: getNextBotReply(questionIndex, value) 
      }
    ]);

    // Proceed in Wizard state
    setStep((prev) => prev + 1);
  };

  const getNextBotReply = (completedQ: number, value: string): string => {
    if (completedQ === 1) {
      return `아주 훌륭합 선택이십니다. [${value}] 기법은 원시 데이터 전송 난제를 세련되게 예단 제어합니다. 그렇다면 품질 심사를 트리거하는 시스템 검증 게이트의 수립 시점은 언제로 설계하는 것이 합리적일까요?`;
    }
    if (completedQ === 2) {
      return `완벽에 가까운 통합 시점이 설계되었습니다! 마지막 관문입니다. 소스코드의 노드가 지능형으로 매핑될 'NLP 명세 기준(RTM 요구사항)'은 어떠한 매체/저장소로부터 지름길로 색인 추출하는 것이 SDLC 환경에 부합하겠습니까?`;
    }
    return "요구 사항 설계가 최종 완결되었습니다! 기입하신 핵심 개발 요구 조건을 기반으로 즉시 적용 가능한 생산 자동화 배포 파이프라인 Blueprint를 가공 생성해드렸습니다. 아래 템플릿을 확인 후 소속 조직의 DevOps 인프라로 수취하십시오.";
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({ q1: null, q2: null, q3: null });
    setChatLog([
      { 
        sender: "bot", 
        text: "재진단을 시작합니다. 연동 설계의 한계를 해소하기 위해 귀하의 신뢰도 높은 프로젝트 가동 형태를 다시 체크해주십시오." 
      }
    ]);
  };

  // Generate automated files/configurations purely client-side based on user's custom layout preferences
  const generatedBlueprint = React.useMemo(() => {
    const q1 = answers.q1 || "GitRepo";
    const q2 = answers.q2 || "OnCommit";
    const q3 = answers.q3 || "CodeDocstring";

    if (q1 === "GitRepo") {
      return `# .github/workflows/node-coverage-pipeline.yml
name: Node Coverage Auto SDLC Validator

on:
  ${q2 === "OnCommit" ? "push:\n    branches: [ \"main\", \"develop\" ]" : q2 === "OnPR" ? "pull_request:\n    branches: [ \"main\" ]" : "schedule:\n    - cron: '0 0 * * *' # Midnight Batch Trigger"}

jobs:
  coverage_audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node Runtime
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Extract Requirements Specifications
        run: |
          echo "Extracting specifications from target sources..."
          ${q3 === "JiraDocs" ? "curl --silent -H 'Authorization: Bearer \${{ secrets.JIRA_API_TOKEN }}' -X GET 'https://jira.internal/rest/api/2/issue/SPECS' > ./rtm-specs.json" : q3 === "CodeDocstring" ? "grep -rI '@REQ-' ./src/ > ./rtm-specs.json || echo '[]' > ./rtm-specs.json" : "echo '{\"manual\": true}' > ./rtm-specs.json"}

      - name: Execute Static AST Parser and Mapping
        run: |
          echo "Triggering Node Coverage Analyzer Headless API Probe..."
          curl -X POST \\
            -H "Content-Type: application/json" \\
            -H "X-Client-Secret: \${{ secrets.COVERAGE_ENGINE_SECRET }}" \\
            -d "{\\"code\\": \\"$(cat ./src/main.js | jq -sRr @uri)\\", \\"requirements\\": \\"$(cat ./rtm-specs.json | jq -sRr @uri)\\"}" \\
            ${ANALYZE_ENDPOINT} \\
            -o ./verification-report.json

      - name: Assert Target Gate Threshold
        run: |
          COVERAGE_NC=$(jq '.nc_percent' ./verification-report.json)
          echo "Current Stat Segment Target Node Coverage: $COVERAGE_NC%"
          if [ "$COVERAGE_NC" -lt 80 ]; then
            echo "::error::Quality Gate Failed! Node Coverage is below 80% limit."
            exit 1
          fi
          echo "Quality core checks fully approved!"`;
    }

    if (q1 === "VSCode") {
      return `// .vscode/settings.json
{
  "node-coverage.endpoint": "${API_ROOT}",
  "node-coverage.apiKey": "\${env:NODE_COVERAGE_SECRET}",
  "node-coverage.autoSync": ${q2 === "OnCommit" ? "true" : "false"},
  "node-coverage.specIntakeMode": "${q3.toLowerCase()}",
  "node-coverage.qualityGateWarning": 80,
  "node-coverage.statusBar.align": "right",
  "node-coverage.highlightColors": {
    "covered": "rgba(161, 130, 74, 0.15)",
    "unreached": "rgba(239, 68, 68, 0.12)"
  }
}`;
    }

    // CI Probe shell script
    return `#!/usr/bin/env bash
# node-coverage-probe-agent.sh
# CI/CD Runner Pre-push Integration Agent daemon script

set -euo pipefail

API_URL="${ANALYZE_ENDPOINT}"
PROJECT_ID="prod-sdlc-integration-probe"
REQ_TAGS="./rtm-specifications.txt"

echo "======================================================="
echo "  NODE COVERAGE SYSTEM PROBE DEPLOYMENT"
echo "  Trigger Context: ${q2} | Specs Extract: ${q3}"
echo "======================================================="

# Step 1: Detect specs
if [ ! -f "$REQ_TAGS" ]; then
    echo "Creating empty specification layout..."
    echo "REQ-01: System constraints validation" > "$REQ_TAGS"
fi

# Step 2: Extract requirements
${q3 === "JiraDocs" ? "echo 'Querying upstream Jira system tickets...'" : "echo 'Analyzing source code docstrings annotations...'; grep -roP 'REQ-\\d+.*' src/ || true"}

# Step 3: API Integration Trigger Proxy
echo "Injecting target codebases to core coverage microservices..."
curl -s -X POST "$API_URL" \\
  -H "X-Project-Token: \${NC_PROBE_SECRET_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"projectId\\": \\"$PROJECT_ID\\",
    \\"language\\": \\"javascript\\",
    \\"code\\": \\"$(cat src/index.js | sed 's/\"/\\\\\"/g')\\",
    \\"requirements\\": \\"$(cat $REQ_TAGS | sed 's/\"/\\\\\"/g')\\"
  }" > report.json

COMPLEXITY=$(jq '.complexity' report.json)
NC_VAL=$(jq '.coveragePercent' report.json)

echo "Report generation successful!"
echo "├── Cyclomatic Complexity: $COMPLEXITY"
echo "└── Node Coverage Ratio  : $NC_VAL%"

if [ "$NC_VAL" -lt 85 ]; then
    echo "[-] EXCEPTION: Quality target error. SDLC pipeline terminated!"
    exit 1
fi
echo "[+] Node Coverage verification successfully finished!"`;
  }, [answers]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBlueprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendCustomMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    setChatLog((prev) => [
      ...prev,
      { sender: "user", text: customMsg },
      { 
        sender: "bot", 
        text: `귀중한 피드백 대단히 지원 감사드립니다. 제출해주신 아이디어 [${customMsg}]에 기반하여, 코드 형상 연계를 한 차원 고속화하기 위한 특수한 원격 프레임워크 플러그인을 아키텍처 로드맵에 전격 명기 반영해두겠습니다. 우리 시스템은 사용자 분들의 로컬 업로드 장벽을 해소하기 위해 상시 대기하고 있습니다.` 
      }
    ]);
    setCustomMsg("");
  };

  return (
    <div className="border border-[#222] bg-[#0c0c0c] rounded-sm p-6 flex flex-col justify-between" id="UX-improvement-consultation-studio">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#A1824A]" />
          <h3 className="text-xs font-sans tracking-widest text-[#A1824A] font-bold uppercase">
            Convenient Source Intake Integration Consultant (편의성 성취 컨설팅 마법사)
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono text-gray-500 bg-[#111] px-2 py-0.5 rounded-xs border border-[#1a1a1a]">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse mr-1" />
          <span>REAL-TIME ADVISORY</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-6">
        로컬 코드를 분석할 때 매번 소스코드를 하이라이팅하여 붙여넣는 절차는 실제 프로덕션 워크플로우 상 비효율적일 수 있습니다. 
        사용자의 현업 SDLC 환경을 인터뷰 형태로 묻고, 개발 피로를 완벽히 덜어내는 **맞춤형 자동화 파이프라인 블루프린트**를 자동 설계합니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[380px]">
        {/* Left Side: Virtual QA Bot Chat Log */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-[#222] bg-[#080808]/40 rounded-sm p-4 h-[380px]">
          <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider block mb-2 border-b border-[#111] pb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#A1824A]" />
            <span>Consultant Dialogue Loop</span>
          </span>

          <div className="flex-1 overflow-y-auto space-y-3.5 mb-3 pr-1 scrollbar-thin text-[11px] leading-relaxed">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 items-start ${chat.sender === "user" ? "justify-end" : ""}`}
              >
                {chat.sender === "bot" && (
                  <div className="p-1 rounded-xs bg-[#A1824A]/10 border border-[#A1824A]/30 text-[#A1824A] shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div 
                  className={`p-2.5 rounded-xs border leading-relaxed ${
                    chat.sender === "user"
                      ? "bg-[#14120e] border-[#A1824A]/30 text-stone-200"
                      : "bg-[#111] border-[#222] text-gray-400"
                  }`}
                >
                  {chat.text}
                </div>
                {chat.sender === "user" && (
                  <div className="p-1 rounded-xs bg-[#111] border border-[#222] text-[#A1824A] shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendCustomMsg} className="flex gap-2 border-t border-[#111] pt-3">
            <input
              type="text"
              placeholder="아키텍트에게 편의성 건의 사안 입력..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="flex-1 text-[11px] bg-[#0c0c0c] border border-[#222] text-stone-200 rounded-sm py-1.5 px-3 outline-hidden focus:border-[#A1824A]/40 placeholder-gray-600 font-sans"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white text-[11px] rounded-xs font-bold transition-colors cursor-pointer"
            >
              전송
            </button>
          </form>
        </div>

        {/* Right Side: Step-by-step Interactive Interview & Blueprints Output */}
        <div className="lg:col-span-7 border border-[#222] bg-[#0c0c0c] rounded-sm p-4 flex flex-col justify-between h-[380px] overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome Intake */}
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full"
                >
                  <div>
                    <h4 className="text-xs font-bold text-stone-200 mb-1 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#A1824A]" />
                      <span>통합 자동화 심사 아키텍처 조율 세션</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-normal mb-4 font-normal">
                      소스코드를 안전하고 신속하게 본 대시보드로 원격 프로브 수집하여, 
                      버전관리 체계와 동기화하는 개발자 편의 중심의 인터뷰 인터페이스를 설계합니다.
                    </p>

                    <div className="bg-[#080808]/80 border border-[#222] p-4 rounded-xs text-[11px] leading-relaxed text-stone-400 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A1824A]" />
                        <span><strong>로컬 코드 추출 가속화</strong>: VS Code / IDE 단독 모듈 싱크 수렴</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A1824A]" />
                        <span><strong>품질 게이트 장벽 무화</strong>: CI/CD 프로브 명령 한 줄로 조율 자동화</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A1824A]" />
                        <span><strong>NLP 요구사항 연동</strong>: 소스 인라인 애노테이션 구문 자동 수집</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#A1824A] hover:bg-[#A1824A]/95 text-white text-xs font-bold rounded-sm cursor-pointer mt-4"
                  >
                    <span>자동 진단 조율 시작 (Start Survey)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {/* Step 1: Intake Preference Qs */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-[#A1824A] uppercase font-bold tracking-wider">INTAKE SYSTEM PREFERENCE (01/03)</span>
                      <span className="text-[10px] text-gray-500 font-mono">1 of 3</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-200 mb-3">
                      Q1. 사용 중인 소스코드 제공 및 에이징 관리 선호도를 선택해 주십시오.
                    </h4>

                    <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                      {q1Options.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleAnswer(1, opt.id, `소스코드 입수 선호도: ${opt.title}`)}
                            className="p-3 bg-[#080808]/90 border border-[#222] hover:border-[#A1824A]/50 rounded-xs cursor-pointer transition-all flex gap-3 text-left hover:bg-[#14120e]"
                          >
                            <div className="p-1.5 rounded-xs bg-[#111] border border-[#222] text-[#A1824A] shrink-0 h-fit">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-stone-200">{opt.title}</span>
                              <span className="text-[10px] text-gray-500 leading-normal">{opt.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(0)}
                    className="text-stone-500 hover:text-stone-300 text-[10px] font-mono flex items-center justify-center gap-1 pt-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>처음으로 돌리기</span>
                  </button>
                </motion.div>
              )}

              {/* Step 2: Trigger conditions Qs */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-[#A1824A] uppercase font-bold tracking-wider">PIPELINE TRIGGER CONDITIONS (02/03)</span>
                      <span className="text-[10px] text-gray-500 font-mono">2 of 3</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-200 mb-3">
                      Q2. 품질 커버리지 심사를 완전 자동으로 구동할 이상적인 파이프라인 트리거 시점은 언제입니까?
                    </h4>

                    <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                      {q2Options.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleAnswer(2, opt.id, `심사 자동 가동 시점: ${opt.title}`)}
                            className="p-3 bg-[#080808]/90 border border-[#222] hover:border-[#A1824A]/50 rounded-xs cursor-pointer transition-all flex gap-3 text-left hover:bg-[#14120e]"
                          >
                            <div className="p-1.5 rounded-xs bg-[#111] border border-[#222] text-[#A1824A] shrink-0 h-fit">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-stone-200">{opt.title}</span>
                              <span className="text-[10px] text-gray-500 leading-normal">{opt.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="text-stone-500 hover:text-stone-300 text-[10px] font-mono flex items-center justify-center gap-1 pt-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>이전 단계로 이동</span>
                  </button>
                </motion.div>
              )}

              {/* Step 3: Spec Extract Qs */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-[#A1824A] uppercase font-bold tracking-wider">REQUIREMENTS SPEC INGESTION (03/03)</span>
                      <span className="text-[10px] text-gray-500 font-mono">3 of 3</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-200 mb-3">
                      Q3. 소스코드 분석 시 일대일 동적 대조할 요구사항 규격(RTM)의 추출 경로는 어디가 상식적입니까?
                    </h4>

                    <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                      {q3Options.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleAnswer(3, opt.id, `요건 추출 방식: ${opt.title}`)}
                            className="p-3 bg-[#080808]/90 border border-[#222] hover:border-[#A1824A]/50 rounded-xs cursor-pointer transition-all flex gap-3 text-left hover:bg-[#14120e]"
                          >
                            <div className="p-1.5 rounded-xs bg-[#111] border border-[#222] text-[#A1824A] shrink-0 h-fit">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-stone-200">{opt.title}</span>
                              <span className="text-[10px] text-gray-500 leading-normal">{opt.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="text-stone-500 hover:text-stone-300 text-[10px] font-mono flex items-center justify-center gap-1 pt-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>이전 단계로 이동</span>
                  </button>
                </motion.div>
              )}

              {/* Step 4: Display customized blueprint outcome */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col justify-between h-full min-h-0"
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-1 bg-[#14120e] p-2 rounded-xs border border-[#A1824A]/25">
                      <span className="text-[10px] font-mono text-[#A1824A] uppercase font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>생성 완료: 맞춤형 DevOps 파이프라인 Blueprint</span>
                      </span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[9px] bg-[#111] text-stone-300 hover:text-white px-2 py-0.5 rounded-xs border border-[#222] cursor-pointer"
                        title="클립보드에 스크립트 정격 복사"
                      >
                        {copied ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-400">복사 완료</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>전체 복사</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex-1 bg-[#080808] border border-[#222] p-2 rounded-xs min-h-0 overflow-auto font-mono text-[9.5px] leading-relaxed text-[#A1824A] relative">
                      <pre className="whitespace-pre scrollbar-thin select-all">
                        {generatedBlueprint}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-3 pt-2.5 border-t border-[#111]">
                    <button
                      onClick={handleReset}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-stone-400 text-[10px] font-bold rounded-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>설계 조율 재설정</span>
                    </button>
                    <button
                      onClick={() => {
                        alert("DevOps 아키텍피가 승인되었습니다. 해당 워크플로우에 따라 소스 수집기 파이브라인 설계 도면이 사내 중앙 시스템으로 연동 시도됩니다.");
                      }}
                      className="flex-1 py-1.5 bg-[#A1824A] hover:bg-[#A1824A]/90 text-white text-[10px] font-bold rounded-xs cursor-pointer transition-colors"
                    >
                      설계 도면 저장 및 출하
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
