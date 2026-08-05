import { AnalysisResults, SupportedLanguage } from "../types";

export const FALLBACK_RESULTS: Record<SupportedLanguage, AnalysisResults> = {
  javascript: {
    nodes: [
      { id: "1", label: "요청 규격 검증", type: "decision", lineStart: 4, lineEnd: 7, reachability: "reachable", description: "주문 품목 누락 및 결제 금액이 0원 이하인지 체크하여 위반 시 즉시 예외 분기 타격" },
      { id: "2", label: "비동기 재고 인스펙션", type: "decision", lineStart: 10, lineEnd: 15, reachability: "reachable", description: "checkStockAsync를 통한 비동기 재고 검증 및 조기 리턴 제어(REQ-01)" },
      { id: "3", label: "결제를 위한 원격 API 게이트웨이 호출", type: "call", lineStart: 17, lineEnd: 18, reachability: "reachable", description: "callPaymentGateway 게이트웨이를 호출하여 실제 지불 상태 수급(REQ-02)" },
      { id: "4", label: "결과 상태 분기 제어", type: "decision", lineStart: 20, lineEnd: 21, reachability: "reachable", description: "API 지불 리서치 APPROVED 결과값에 따른 라우팅 제어" },
      { id: "5", label: "성공 원장 영구 저장", type: "basic", lineStart: 22, lineEnd: 24, reachability: "reachable", description: "성공 결제 건에 대한 영구 데이터베이스 마キング 세이브(REQ-03)" },
      { id: "6", label: "오류 거절 원장 로그", type: "basic", lineStart: 25, lineEnd: 27, reachability: "reachable", description: "거부 결제 건에 대한 실패 전용 원장 로그 보존" },
      { id: "7", label: "글로벌 비동기 에러 복구", type: "basic", lineStart: 29, lineEnd: 33, reachability: "conditional", description: "Promise 거부 및 원격 텔레메트리 크래시 정합성 디그레이딩" },
      { id: "8", label: "비가려진 가상 데드 노드", type: "basic", lineStart: 36, lineEnd: 38, reachability: "unreachable", description: "CRAZY_SOLD_OUT 조건 발생 시, 이 구역은 원칙적으로 절대 타지 않는 정적 데드 구역" }
    ],
    edges: [
      { source: "1", target: "7", condition: "amount <= 0" },
      { source: "1", target: "2", condition: "normal" },
      { source: "2", target: "6", condition: "no stock" },
      { source: "2", target: "3", condition: "stock OK" },
      { source: "3", target: "4" },
      { source: "4", target: "5", condition: "APPROVED" },
      { source: "4", target: "6", condition: "DECLINED" }
    ],
    rtm: [
      { reqId: "REQ-01", reqText: "구매 요청된 상품의 재고 상태를 가공하고 실시간으로 차감 유효성을 검사해야 한다.", mappedNodeIds: ["2"] },
      { reqId: "REQ-02", reqText: "결제 Gateway API 서비스와의 지연(Latency) 통신을 비동기식(promise)으로 처리하고 에러에 즉각 응답해야 한다.", mappedNodeIds: ["3"] },
      { reqId: "REQ-03", reqText: "비동기 처리 완료 후, 로컬 트랜잭션 수치 기록 노드(SaveLog)를 정확히 실행하여 원장을 마킹해야 한다.", mappedNodeIds: ["5", "6"] },
      { reqId: "REQ-04", reqText: "만약 결제 금액이 0원 이하이거나 재고 검증에 실패하면, 데드 블록이나 예외 던지기를 통해 후행 진행을 원천 봉쇄한다.", mappedNodeIds: ["1", "8"] }
    ],
    complexity: {
      cyclomaticComplexity: 4,
      totalNodes: 8,
      totalEdges: 7
    },
    languageInsights: "JavaScript는 싱글 스레드 이벤트 루프 기반 비동기 처리가 중심이므로, catch 구역(N7)이나 Unhandled Promise Rejection 구간의 제어 흐름 추적이 핵심입니다. 소스 맵 연계를 사용해 런타임 비동기 콜백 마킹을 수립해 기술 부채 드리프트를 억제하십시오."
  },
  java: {
    nodes: [
      { id: "1", label: "기본 최소 이체 자격 검사", type: "decision", lineStart: 6, lineEnd: 8, reachability: "reachable", description: "이체 요구 수량이 최소 1달러 한도 이상인지 식별 룰" },
      { id: "2", label: "다형성 훅 대상 한도 취득", type: "call", lineStart: 10, lineEnd: 12, reachability: "reachable", description: "getMaxTransferLimit 다형성(Polymorphism) 하방 훅 도달 (Yo-yo down) (REQ-12)" },
      { id: "3", label: "VIP 등급 상한선 제공 (1천만)", type: "basic", lineStart: 18, lineEnd: 21, reachability: "reachable", description: "VipAccountPolicy 클래스에 따른 가변 한도 임계치 리턴 (Yo-yo up) (REQ-11)" },
      { id: "4", label: "Basic 등급 상한선 제공 (50만)", type: "basic", lineStart: 26, lineEnd: 29, reachability: "reachable", description: "BasicAccountPolicy 클래스에 따른 가변 한도 임계치 리턴" },
      { id: "5", label: "안전 정책 유효성 검사", type: "decision", lineStart: 34, lineEnd: 37, reachability: "reachable", description: "AccountPolicy가 비어 있을 경우 IllegalArgumentException 위반 트랩" },
      { id: "6", label: "요요 그래프 진입 및 검증", type: "decision", lineStart: 39, lineEnd: 41, reachability: "reachable", description: "policy.validateLimit를 진입점으로 오버라이드 유효성 결과 병합" },
      { id: "7", label: "성공 저널 로그 마킹", type: "basic", lineStart: 42, lineEnd: 44, reachability: "reachable", description: "정상 이체 트랜잭션 도서 원장 마크 이행" },
      { id: "8", label: "위반 거부 저널 보존", type: "basic", lineStart: 45, lineEnd: 47, reachability: "conditional", description: "한도 제한 및 인증 조건 탈락 저널 트래킹" }
    ],
    edges: [
      { source: "1", target: "2", condition: "amount >= 1.0" },
      { source: "2", target: "3", condition: "Vip Hook" },
      { source: "2", target: "4", condition: "Basic Hook" },
      { source: "5", target: "6" },
      { source: "6", target: "7", condition: "Authorized" },
      { source: "6", target: "8", condition: "Rejected" }
    ],
    rtm: [
      { reqId: "REQ-11", reqText: "엔터프라이즈 계정 등급(VIP, BASIC)에 따른 동적 등급 한도 제어(Polymorphic Limits)를 지원한다.", mappedNodeIds: ["3", "4"] },
      { reqId: "REQ-12", reqText: "다형성 구조 상에서 자식 클래스가 부모의 검증 로직을 오버라이딩하여 실행 흐름이 오르락내리락하는 요요 효과(Yo-yo inheritance flow)를 추적 가능해야 한다.", mappedNodeIds: ["2"] },
      { reqId: "REQ-13", reqText: "등급 제한 조건에 미도달 시 강제 예외 분기 처리를 통해 부도 수표 등록을 막는다.", mappedNodeIds: ["5", "8"] }
    ],
    complexity: {
      cyclomaticComplexity: 3,
      totalNodes: 8,
      totalEdges: 6
    },
    languageInsights: "Java의 경우 다형성(Polymorphism) 호출로 인해 동일 가상 테이블에서 여러 자손 노드로 비유적 점프가 발생합니다. 요요 그래프 분석기를 사용해 부모-자식 왕복 제어 흐름을 명확하게 도출하는 아키텍처 정밀 타격 모델이 반영되었습니다."
  },
  cpp: {
    nodes: [
      { id: "1", label: "간접 호출 대상 stdoutLogger", type: "basic", lineStart: 9, lineEnd: 12, reachability: "reachable", description: "함수 포인터를 통한 STDOUT 타겟 로그 디렉션 (REQ-21)" },
      { id: "2", label: "간접 호출 대상 fileLogger", type: "basic", lineStart: 14, lineEnd: 17, reachability: "reachable", description: "함수 포인터를 통한 FILE_IO 타겟 로그 디렉션" },
      { id: "3", label: "함수 포인터 안전 통제 노드", type: "decision", lineStart: 20, lineEnd: 23, reachability: "reachable", description: "콜백 포인트 NULL 여부 식별 예외 리턴" },
      { id: "4", label: "빌드 컴파일러 매크로 검사 노드", type: "decision", lineStart: 25, lineEnd: 26, reachability: "reachable", description: "ALERT_LEVEL 전처리기 마크가 1인지 0인지 정적 분사 제어 (REQ-22)" },
      { id: "5", label: "센서 최소 구역 에러 리턴", type: "basic", lineStart: 28, lineEnd: 31, reachability: "conditional", description: "임계 조건 MIN_LIMIT 미달 트라이포트 즉시 배출" },
      { id: "6", label: "함수 포인터 간접 실행 노드", type: "call", lineStart: 34, lineEnd: 37, reachability: "reachable", description: "logger 함수 포인터 실제 참조 런타임 활성 (REQ-21)" },
      { id: "7", label: "성 정상 종료 자원 회수", type: "basic", lineStart: 39, lineEnd: 41, reachability: "reachable", description: "성공 센싱 마무리 및 메모리 자원 회수 (REQ-23)" }
    ],
    edges: [
      { source: "3", target: "4", condition: "logger OK" },
      { source: "4", target: "5", condition: "val < MIN" },
      { source: "4", target: "6", condition: "val >= MIN" },
      { source: "6", target: "1", condition: "stdout pointer" },
      { source: "6", target: "2", condition: "file pointer" },
      { source: "6", target: "7" }
    ],
    rtm: [
      { reqId: "REQ-21", reqText: "포인터 간접 참조(Indirect Dereference / Function Pointer)를 사용하여 제어권을 런타임에 동적으로 점프(Jump)제어한다.", mappedNodeIds: ["1", "6"] },
      { reqId: "REQ-22", reqText: "빌드 전처리기의 매크로 확장(#define ASSERT) 및 분기 논리를 모의하여 정량적 커버리지 지표에 노드를 계측한다.", mappedNodeIds: ["4"] },
      { reqId: "REQ-23", reqText: "메모리 누수 방지를 위한 자원 안전 분기 및 자원 반환 노드를 감지한다.", mappedNodeIds: ["3", "7"] }
    ],
    complexity: {
      cyclomaticComplexity: 5,
      totalNodes: 7,
      totalEdges: 6
    },
    languageInsights: "C/C++에서는 함수 포인터가 가리키는 런타임 수신 주소를 알아내기 위해 컴파일 컴파일 시그니처 분석과 dylib 로딩 프로파일러가 결합합니다. 매크로 팽창으로 인한 중복 계산 역시 노드에 등가 마킹되었습니다."
  },
  python: {
    nodes: [
      { id: "1", label: "인수 동적 유형 감지", type: "decision", lineStart: 2, lineEnd: 3, reachability: "reachable", description: "data 객체가 List 형식인지 Dict 형식인지 형 진단 분기 (REQ-31)" },
      { id: "2", label: "리스트 객체 전수 조사", type: "basic", lineStart: 4, lineEnd: 9, reachability: "reachable", description: "리스트 내 null 값 스킵 제어 및 일괄 가공" },
      { id: "3", label: "필수 딕셔너리 키 검증", type: "decision", lineStart: 11, lineEnd: 15, reachability: "reachable", description: "payload 키 부재 시 MALFORMED_ERROR 통보 (REQ-32)" },
      { id: "4", label: "수치 데이터 컨버팅 트랩", type: "decision", lineStart: 17, lineEnd: 21, reachability: "reachable", description: "float 강제 변환 및 음수 범위 이상 유무 체크" },
      { id: "5", label: "형 변환 오류 역추적 노드", type: "basic", lineStart: 22, lineEnd: 24, reachability: "conditional", description: "ValueError, TypeError 동적 캐치 후 원장 에러 기록" },
      { id: "6", label: "최종 가변 예외 처리부", type: "basic", lineStart: 26, lineEnd: 28, reachability: "unreachable", description: "목표 스펙 미부합 시 TypeError 즉각 배출 (REQ-33)" }
    ],
    edges: [
      { source: "1", target: "2", condition: "is list" },
      { source: "1", target: "3", condition: "is dict" },
      { source: "3", target: "4", condition: "payload OK" },
      { source: "4", target: "5", condition: "cast fail" },
      { source: "1", target: "6", condition: "others" }
    ],
    rtm: [
      { reqId: "REQ-31", reqText: "파이썬의 동적 타입(Dynamic Typing) 특성에 맞춰 런타임에 입력 인수의 자료 구조(List vs Dict)를 유형 분석 노드에서 구별한다.", mappedNodeIds: ["1"] },
      { reqId: "REQ-32", reqText: "복잡한 자료구조 내에 내포된 비정상 키(Missing keys) 누락 장애를 증분 파싱 노드로 디버깅한다.", mappedNodeIds: ["3"] },
      { reqId: "REQ-33", reqText: "AI 에이전트 연동을 대비한 제약 조건 생성 및 가변 패치 최적화 구조를 구축한다.", mappedNodeIds: ["4", "6"] }
    ],
    complexity: {
      cyclomaticComplexity: 4,
      totalNodes: 6,
      totalEdges: 5
    },
    languageInsights: "Python은 동적 타이핑으로 인해 소스 코드 행 수준의 타입 힌트만으로는 추정이 어렵습니다. 실행 시점의 AST 트리 증분 파싱과 기호 추정 예측 모델을 결합해 정적/동적 상반적 노드를 식별합니다."
  }
};
