# Node Coverage Analyzer

제품 전 생애주기 통합형 프로그래밍 언어 다변화 **노드 커버리지(Node Coverage) 분석 시스템**.
CFG(Control Flow Graph) 기반으로 소스 코드의 도달 가능한 실행 노드와 분기 경로를 추출하고, 요구사항과의 추적성(RTM) 및 커버리지 최적화를 제공하는 AI 어플리케이션입니다.

Google AI Studio 어플리케이션으로, **서버 사이드 Gemini API** 기반 정적 분석을 수행합니다.

## 주요 기능

- **다중 언어 지원** — JavaScript / Python / Java / C/C++ 코드 분석
- **CFG 자동 추출** — AI가 노드(start/basic/decision/call/end), 에지, 도달 가능성(reachable/unreachable/conditional)을 자동 추출
- **Cyclomatic Complexity(순환 복잡도)** 자동 계산
- **RTM(Requirements Traceability Matrix)** — NLP 요구사항과 코드 노드 간 추적 매핑
- **인터랙티브 커버리지 시뮬레이터** — 노드 클릭/실행 시뮬레이션, 풀 테스트 스위트 애니메이션, 리셋
- **AI 기반 에이전트 커버리지 최적화** — 미커버 노드의 심볼릭 제약(Symbolic Constraints), 테스트 입력, 단위 테스트 코드, AutoFix 제안
- **실제 Git 저장소 연동** — 원격 저장소를 shallow-clone 하여 소스 트리 스캔 및 개별 파일 읽기
- **분석 이력 관리** — `localStorage` 기반 세션 저장/로드 (최대 30개)
- **언어별 고유 리스크 통찰**(소프트웨어 침식 분석) 제공

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| 차트/그래프 | Recharts, Motion (CFG 그래프 시각화) |
| 백엔드 | Express 4 (단일 서버: 정적 호스팅 + API) |
| AI | Google Gemini (`gemini-3.5-flash`) — 서버 사이드 전용 |
| 아이콘 | lucide-react |

---

## 아키텍처

단일 **Express 서버**(`server.ts`)가 React 앱을 호스팅하면서 동시에 Gemini 기반 API와 Git 저장소 스캔을 제공합니다.

- **개발 모드** (`NODE_ENV !== "production"`): Express가 Vite 미들웨어를 마운트 → 파일 수정 시 FE/BE 모두 hot-reload
- **프로덕션 모드** (`NODE_ENV=production`): `dist/`로 빌드된 정적 자산을 호스팅

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 헬스체크 |
| POST | `/api/analyze` | 소스코드 CFG/노드/에지/RTM/복잡도 자동 추출 |
| POST | `/api/optimize` | 미커버 노드의 에이전트 커버리지 최적화 |
| POST | `/api/repo/scan` | 원격 Git 저장소 clone·스캔, 소스 파일 트리 반환 |
| POST | `/api/repo/file` | 스캔한 저장소의 개별 소스 파일 읽기 |

> Gemini SDK는 **서버에서만** 호출됩니다. 클라이언트는 `/api/*`를 통해서만 통신합니다.

---

## 빠른 시작

**사전 요구사항:** Node.js

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.local 생성, .env.example 참고)
GEMINI_API_KEY="your_gemini_api_key"

# 3. 개발 서버 실행 (포트 3000)
npm run dev
```

### 빌드 / 배포

```bash
npm run build   # 클라이언트 빌드(dist/) + 서버 번들(dist/server.cjs)
npm start       # NODE_ENV=production 인 경우 정적 호스팅 모드로 실행
```

---

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | ✅ | Gemini AI API 키 (AI Studio에서 런타임에 주입됨) |
| `APP_URL` | ❌ | 어플리케이션 호스팅 URL (자기 참조/콜백 용) |

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (Express + Vite 미들웨어, 포트 3000) |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm start` | 빌드된 서버 실행 (`dist/server.cjs`) |
| `npm run lint` | TypeScript 타입체크 (`tsc --noEmit`) |
| `npm run clean` | `dist/` 및 임시 `server.js` 정리 |

---

## 디렉토리 구조

```
src/
├── components/        # UI 컴포넌트 (CFG 시각화, 커버리지 시뮬레이터, 최적화 등)
├── data/              # fallbackResults / mockTemplates (API 미연결 시 데모 데이터)
├── App.tsx            # 메인 대시보드
├── types.ts           # 공용 타입 (AnalysisResults, CFGNode, CFGEdge 등)
└── index.css
server.ts              # Express 서버 + Gemini API + Git 저장소 스캔
docs/EVIDENCE.md       # 개선 증적 로그 (IMP-XXX)
```

---

## 지원 언어

`javascript` | `python` | `java` | `cpp`

Git 저장소 스캔 시 확장자 기반 언어 자동 판별: `js/mjs/cjs/jsx/ts/tsx`, `py/pyw`, `java`, `c/h/cc/cpp/cxx/hpp/hh`.

---

## 라이선스

[MIT](LICENSE)

© 2026 Node Coverage Analyzer