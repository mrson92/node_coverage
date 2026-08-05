import { CodeTemplate } from "../types";

export const TEMPLATES: CodeTemplate[] = [
  {
    name: "비동기 주문 및 검증 시스템 (JavaScript)",
    language: "javascript",
    requirements: `[REQ-01] 구매 요청된 상품의 재고 상태를 가공하고 실시간으로 차감 유효성을 검사해야 한다.
[REQ-02] 결제 Gateway API 서비스와의 지연(Latency) 통신을 비동기식(promise)으로 처리하고 에러에 즉각 응답해야 한다.
[REQ-03] 비동기 처리 완료 후, 로컬 트랜잭션 수치 기록 노드(SaveLog)를 정확히 실행하여 원장을 마킹해야 한다.
[REQ-04] 만약 결제 금액이 0원 이하이거나 재고 검증에 실패하면, 데드 블록이나 예외 던지기를 통해 후행 진행을 원천 봉쇄한다.`,
    code: `async function processOrder(orderId, item, amount) {
  console.log("Starting order transaction:", orderId);
  
  // Node 1: 요청 유효성 검사
  if (!item || amount <= 0) {
    throw new Error("Invalid order specification"); // Exception Node
  }

  try {
    // Node 2: 재고 검증 비동기 분기 (REQ-01)
    const stockAvailable = await checkStockAsync(item);
    if (!stockAvailable) {
      console.error("Stock deficiency warning for item:", item);
      return { success: false, reason: "OUT_OF_STOCK" }; // Early termination
    }

    // Node 3: 외부 결제 게이트웨이 호출 (REQ-02)
    const paymentResult = await callPaymentGateway(orderId, amount);
    
    // Node 4: 결과 매핑 분기 제어
    if (paymentResult.status === "APPROVED") {
      // Node 5: 원장 로그 보존 (REQ-03)
      await saveLogToLedger(orderId, "SUCCESS");
      return { success: true, txnId: paymentResult.txnId };
    } else {
      // Node 6: 결제 실패 원장 저장
      await saveLogToLedger(orderId, "FAILED_GATEWAY");
      return { success: false, reason: "PAYMENT_DECLINED" };
    }
  } catch (error) {
    // Node 7: 글로벌 비동기 에러 복구 핸들링 (Event loop fallback)
    console.error("Critical promise crash:", error);
    await logErrorToTelemetry(orderId, error.message);
    throw error;
  }
}

// 비동기 모의 함수
function checkStockAsync(item) {
  return new Promise(resolve => setTimeout(() => resolve(item !== "CRAZY_SOLD_OUT"), 500));
}
function callPaymentGateway(id, amount) {
  return new Promise(resolve => setTimeout(() => resolve({ status: amount > 500000 ? "DECLINED" : "APPROVED", txnId: "TX_" + id }), 600));
}
function saveLogToLedger(id, stat) { return Promise.resolve(true); }
function logErrorToTelemetry(id, msg) { return Promise.resolve(true); }
`
  },
  {
    name: "상속 계층구조 요요 효과 시나리오 (Java)",
    language: "java",
    requirements: `[REQ-11] 엔터프라이즈 계정 등급(VIP, BASIC)에 따른 동적 등급 한도 제어(Polymorphic Limits)를 지원한다.
[REQ-12] 다형성 구조 상에서 자식 클래스가 부모의 검증 로직을 오버라이딩하여 실행 흐름이 오르락내리락하는 요요 효과(Yo-yo inheritance flow)를 추적 가능해야 한다.
[REQ-13] 등급 제한 조건에 미도달 시 강제 예외 분기 처리를 통해 부도 수표 등록을 막는다.`,
    code: `public class BankTransactionProcessor {
    
    // 상위 계정 정책 관리자 (Abstract Class)
    public static abstract class AccountPolicy {
        public boolean validateLimit(double amount) {
            // Node 1: 기본 최소 이체 자격 검증 (Yo-yo start)
            if (amount < 1.0) return false;
            
            // Node 2: 다형성 자손 오버라이딩 훅 호출 (Yo-yo down)
            double limit = getMaxTransferLimit();
            return amount <= limit;
        }
        
        public abstract double getMaxTransferLimit();
    }

    // VIP 고객 제한 재정의 클래스 (REQ-11, REQ-12)
    public static class VipAccountPolicy extends AccountPolicy {
        @Override
        public double getMaxTransferLimit() {
            // Node 3: VIP 상위 임계 한도 재산출 (Yo-yo up)
            return 10000000.0; 
        }
    }

    // 일반 베이직 고객 제한 클래스
    public static class BasicAccountPolicy extends AccountPolicy {
        @Override
        public double getMaxTransferLimit() {
            // Node 4: 일반인용 좁은 임계 한도 제한
            return 500000.0;
        }
    }

    public boolean executeTransfer(AccountPolicy policy, double amount) {
        // Node 5: 다속성 바인딩 유효성 검사 (REQ-13)
        if (policy == null) {
            throw new IllegalArgumentException("Missing transfer policy specification");
        }
        
        // Node 6: 요요 그래프 진입 노드
        boolean isAuthorized = policy.validateLimit(amount);
        if (isAuthorized) {
            // Node 7: 인증 후 전송 로그 이행
            recordJournalEntry(amount, "COMPLETED");
            return true;
        } else {
            // Node 8: 위반 거부 카운트 노드
            recordJournalEntry(amount, "REJECTED_BY_LIMIT");
            return false;
        }
    }
    
    private void recordJournalEntry(double value, String status) {
        System.out.println("Tx Recorded (Value: " + value + ", Status: " + status + ")");
    }
}
`
  },
  {
    name: "포인터 간접 참조 및 매크로 검사 (C/C++)",
    language: "cpp",
    requirements: `[REQ-21] 포인터 간접 참조(Indirect Dereference / Function Pointer)를 사용하여 제어권을 런타임에 동적으로 점프(Jump)제어한다.
[REQ-22] 빌드 전처리기의 매크로 확장(#define ASSERT) 및 분기 논리를 모의하여 정량적 커버리지 지표에 노드를 계측한다.
[REQ-23] 메모리 누수 방지를 위한 자원 안전 분기 및 자원 반환 노드를 감지한다.`,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MIN_LIMIT 10
#define ALERT_LEVEL(val) ((val) > 1000 ? 1 : 0) // Preprocessor logic (REQ-22)

typedef void (*LogCallback)(int, const char*); // Indirect flow pointer

void stdoutLogger(int level, const char* msg) {
    // Node 1: 간접 호출 대상 1 (REQ-21)
    printf("[STDOUT] Level %d: %s\\n", level, msg);
}

void fileLogger(int level, const char* msg) {
    // Node 2: 간접 호출 대상 2
    printf("[FILE_IO] Logged %d: %s\\n", level, msg);
}

int handleSensorInput(int sensorValue, LogCallback logger) {
    // Node 3: 안전 보호 및 널 체크
    if (logger == NULL) {
        return -1; // Exception Exit
    }

    // Node 4: 전처리기 확장 매크로 적용 구역 (REQ-22)
    int level = ALERT_LEVEL(sensorValue);
    
    if (sensorValue < MIN_LIMIT) {
        // Node 5: 저수준 경고
        logger(0, "Sensor reading extremely depleted."); 
        return 0;
    }

    // Node 6: 중점 로직 및 포인터 점프 실행 (REQ-21, REQ-23)
    char buffer[128];
    snprintf(buffer, sizeof(buffer), "System value is optimal at %d", sensorValue);
    
    logger(level, buffer);
    
    // Node 7: 정상 종료 반환 노드
    return 1;
}
`
  },
  {
    name: "동적 타이핑 데이터 가변 분기 (Python)",
    language: "python",
    requirements: `[REQ-31] 파이썬의 동적 타입(Dynamic Typing) 특성에 맞춰 런타임에 입력 인수의 자료 구조(List vs Dict)를 유형 분석 노드에서 구별한다.
[REQ-32] 복잡한 자료구조 내에 내포된 비정상 키(Missing keys) 누락 장애를 증분 파싱 노드로 디버깅한다.
[REQ-33] AI 에이전트 연동을 대비한 제약 조건 생성 및 가변 패치 최적화 구조를 구축한다.`,
    code: `def parse_telemetry_payload(data):
    # Node 1: 동적 자료 유형 탐지 (REQ-31)
    if isinstance(data, list):
        # Node 2: 리스트 객체 증분 파싱 노드
        processed_elements = []
        for index, item in enumerate(data):
            if item is None:
                continue # Skip dead values
            processed_elements.append(str(item))
        return {"mode": "batch", "count": len(processed_elements)}
        
    elif isinstance(data, dict):
        # Node 3: 딕셔너리 키 존재 여부 인스펙션 (REQ-32)
        if "payload" not in data:
            # Node 4: 필수 프로토콜 누락 예외 반환
            return {"status": "MALFORMED_ERROR", "description": "Key 'payload' is mandatory"}
            
        payload = data["payload"]
        
        # Node 5: 수치 형변환 시도 및 예외 분기
        try:
            numeric_val = float(payload)
            if numeric_val < 0.0:
                # Node 6: 음수 오류 노드
                return {"status": "RANGE_ERROR", "value": numeric_val}
            return {"status": "SUCCESS", "parsed": numeric_val}
        except (ValueError, TypeError) as e:
            # Node 7: 포맷 컨버전 불일치 오류 노드
            return {"status": "TYPE_ERROR", "system_message": str(e)}
            
    else:
        # Node 8: 미확인 형식 탈출 노드
        raise TypeError("Unsupported payload type provided to telemetry system")
`
  }
];
