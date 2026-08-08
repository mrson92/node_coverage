# Node Coverage Analyzer - 개선 증적 (Improvement Evidence)

이 문서는 프로젝트 개선 작업의 **증적(Evidence)** 을 지속적으로 기록합니다.
각 개선 항목은 다음 규칙에 따라 기록합니다.

## 기록 규칙
- **항목번호**: `IMP-XXX` (증가)
- **날짜**: 개선 완료일 (YYYY-MM-DD)
- **상태**: `진행 중` → `완료` / `폐기`
- **재현 가능한 검증 절차**를 함께 남깁니다 (실행 명령, 스크린샷, 테스트 결과)

---

## IMP-001: 소스 선택 방식 개선

- **상태**: 진행 중
- **날짜**: 2026-08-04
- **작성자**: opencode
- **개선 목표**: 소스를 선택하는 방법을 개선한다.

### 문제 분석 (As-Is)
현재 소스 선택 방식은 3가지이며 각각 제약이 있다.

| 방식 | 설명 | 문제점 |
|------|------|--------|
| 언어 시나리오 드롭다운 | 4종 템플릿 선택 (`src/App.tsx` `language-scenario-selector`) | 내장 템플릿만 선택 가능, 실제 소스 선택 불가 |
| MultiFileGitAnalyzer | Git 스캔 시뮬레이션 (`src/components/MultiFileGitAnalyzer.tsx`) | **가상 코드베이스 Mock** 으로 실제 저장소/파일과 연결 안 됨 |
| 코드 textarea 붙여넣기 | `source-code-editor`에 직접 입력 | 수동 붙여넣기만 가능, 파일 선택 불가 |

핵심 문제:
1. **실제 소스 파일을 선택할 수단이 없다** (브라우저 파일 선택 / 실제 Git 연동 부재)
2. Git 분석기(`MultiFileGitAnalyzer`)가 순수 시뮬레이션이라 "실제 소스 기반 분석"이라는 목적과 괴리
3. 선택한 소스의 **언어 자동 판별** 기능이 없음 (언어를 수동 지정해야 함)

### 개선 방향 (To-Be)
- [ ] 실제 로컬 파일 선택 수단 제공 (브라우저 파일 선택 + 드래그앤드롭)
- [ ] 선택한 파일의 언어 자동 판별
- [ ] (선택) 실제 Git 저장소 연동 또는 기존 가상 스캔과의 명확한 구분

### 검증 절차
- [ ] (예정) 개선 UI에서 로컬 파일 선택 시 editor에 코드 로드 확인
- [ ] (예정) 언어 자동 판별 결과 확인
- [ ] (예정) `npm run lint` 통과

### 변경 파일
- (작성 예정)

### 결과 / 스크린샷
- (작성 예정)

---

## IMP-002: 정적 분석 리뷰 후속 버그 수정 (2026-08-05)

- **상태**: 완료
- **날짜**: 2026-08-05
- **작성자**: opencode
- **개선 목표**: 전체 코드 리뷰에서 발견된 결함을 수정하고 재현 가능한 검증 절차와 함께 증적을 남긴다.

### 발견·수정 내역

| 항목 | 심각도 | 수정 내용 |
|------|--------|-----------|
| `components/ui/field.tsx` `new Map(...).values()` 추론이 `unknown`으로 떨어져 `error.message`에 대한 TS2339 3건 | 높음 | Map 추론에 의존하지 않는 순수 dedupe 루프로 재작성 (`components/ui/field.tsx:188`) |
| `App.tsx` auth gate의 조기 `return <AuthScreen/>` 이후 hooks 호출 → React Hooks 규칙 위반 (로그인/로그아웃 시 "Rendered more hooks than during the previous render" 크래시 유발) | 높음 | `App`(auth gate)과 `AppDashboard`(본체)로 컴포넌트 분리. 모든 hook이 `AppDashboard`에만 존재하도록 구조 변경 (`src/App.tsx`) |
| `src/data/mockTemplates.ts` Python 템플릿에 `try { ... } catch (ValueError, TypeError) as e:` (C-style) 잘못된 문법 | 중간 | 정상 Python `try:/except (...):` 로 수정, `compile()` 문법 검증 통과 |
| Edge Coverage(EC)를 `nc * 0.85`로 하드코딩 | 중간 | 양 끝 노드가 모두 `isCovered`인 에지를 실측 집계하도록 계산 (`src/App.tsx` stats memo) |
| 헤더의 UTC Clock 정적 값 `2026-06-12` | 낮음 | 1분 주기 갱신되는 동적 UTC 날짜 표시로 변경 |

### 검증 절차
- [x] `npm run lint` (`tsc --noEmit`) → **TypeScript: No errors found**
- [x] `npm run build` → 클라이언트(`dist/`) + 서버 번들(`dist/server.cjs`) 정상 생성
- [x] 수정된 Python 템플릿 `compile()` 문법 검증

### 변경 파일
- `components/ui/field.tsx`
- `src/App.tsx`
- `src/data/mockTemplates.ts`
- `docs/EVIDENCE.md`

### 결과 / 스크린샷
- 빌드 산출물: `dist/index-B4fc6KGK.css`, `dist/index-*.js`(gzip 284.65 kB), `dist/server.cjs` 생성

---

## IMP-003: shadcn UI 도입 및 로그인(Auth) 게이트 추가 (2026-08-05)

- **상태**: 완료
- **날짜**: 2026-08-05
- **작성자**: opencode
- **개선 목표**: shadcn/ui 기반 컴포넌트 기반을 정착시키고, 앱 진입 전 데모 로그인 화면을 추가한다.

### 개선 내역

| 항목 | 내용 |
|------|------|
| shadcn/ui 초기화 | `components.json`, `lib/utils.ts`(cn 유틸), `components/ui/*` 14종(button/card/input/field/dialog/alert/badge/checkbox/separator/spinner/input-group/label/textarea) 추가 |
| 다크 테마 적용 | `src/index.css`에 shadcn 테마 변수 + `@custom-variant dark`, `index.html`을 `lang="ko" class="dark"` 및 `color-scheme: dark`로 설정. `@fontsource-variable/geist` 도입 |
| 로그인인증 게이트 | `AuthScreen.tsx` 추가. `App`(인증 게이트) → `AppDashboard`(본체) 구조로 인증 분기. localStorage/sessionStorage 기반 데모 인증 (데모 계정 `demo@nodecov.io`/`demo1234`) |
| 로그아웃 UI | 헤더에 로그아웃 버튼(`logout-btn`) 추가 (`AppDashboard`) |
| 부수 개선 | `nginx` 커밋 대상 의존성 추가(`@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`) |

### 비고 (알려진 제약 → 백로그)
- AuthScreen은 localStorage 평문/하드코딩 데모 계정을 쓰는 **데모 수준** 인증. 보안 강화는 백로그(백엔드 인증 연동) 참조.
- 빌드 청크 크기 944.12 kB (gzip 284.65 kB) — 코드 스플리팅은 백로그 참조.

### 검증 절차
- [x] `npm run lint` (`tsc --noEmit`) → **TypeScript: No errors found**
- [x] `npm run build` 정상 생성 확인 (파일 세트 추가 등록)

### 변경 파일
- `components.json`, `lib/utils.ts`, `components/ui/*`, `docs/TODO.md`, `opencode.json`
- `src/components/AuthScreen.tsx`, `src/App.tsx`, `src/index.css`, `index.html`
- `package.json`, `package-lock.json`
- `docs/EVIDENCE.md`

### 결과 / 스크린샷
- 커밋: `151c23f` `feat: shadcn UI 컴포넌트 추가 및 다크 테마 적용` → `origin/main` 푸시 완료 (`a88a5c4..151c23f`)

---

## IMP-004: Podman/Docker 컨테이너라이제이션 지원 (2026-08-05)

- **상태**: 완료
- **날짜**: 2026-08-05
- **작성자**: Antigravity
- **개선 목표**: 애플리케이션을 Podman 또는 Docker 컨테이너 환경에서 안정적으로 빌드하고 구동할 수 있도록 지원한다.

### 개선 내역

| 항목 | 내용 |
|------|------|
| Dockerfile 추가 | 멀티스테이지 빌드를 통해 프론트엔드/백엔드 최적 컴파일 빌드 후, Node.js slim 환경에 배포. Git 저장소 분석을 위해 `git` 바이너리 설치 및 `.repo-cache` 폴더 권한 부여 |
| compose.yaml 추가 | `podman compose` 또는 `docker compose`를 이용하여 손쉽게 컨테이너를 구동할 수 있도록 설정. 호스트의 `GEMINI_API_KEY` 환경 변수를 자동 매핑 |
| PORT & HOST 바인딩 검증 | 백엔드 서버(`server.ts`)가 이미 `0.0.0.0:3000`으로 바인딩되어 있어, 컨테이너 포트 포워딩에 별도 코드 변경 불필요 확인 |

### 검증 절차
- [x] `npm run lint` 통과
- [x] `podman build -t node-coverage-analyzer:latest .` 이미지 빌드 성공
- [x] `podman compose up`을 통한 서비스 구동 및 `http://localhost:3000/api/health` 헬스체크 정상 동작 확인

### 변경 파일
- `Dockerfile` [NEW]
- `compose.yaml` [NEW]
- `docs/EVIDENCE.md`

---

## IMP-005: TODO 백로그 항목 일괄 해소 (로컬 파일 선택/실측 지표/청크 분리) (2026-08-07)

- **상태**: 완료
- **날짜**: 2026-08-07
- **작성자**: opencode
- **개선 목표**: `docs/TODO.md` 백로그에 남아 있던 미해결 항목을 검증 후 일괄 해소한다.

### 개선 내역

| 항목 | 내용 |
|------|------|
| IMP-001 로컬 파일 선택/드래그앤드롭 | `LocalFileUploader.tsx` [NEW] + `utils/languageDetection.ts` [NEW]. 브라우저 파일 선택/드래그앤드롭으로 2MB 이하 소스를 로드하고 확장자 기반 언어 자동 판별(js/ts/jsx→javascript, py→python, java, c/cpp/h 등→cpp) 후 워크벤치에 주입. `src/App.tsx` Active Source Editor Block 상단에 배치 |
| 기술 부채 지수 카드 하드코딩 | `App.tsx` stats memo에서 `debt`(미커버 노드 비율×10 + 복잡도 가중) 실측 계산. 기존 정적 `10.8 dS` 제거, 세션 평균 대비 delta 표기 및 badge(`안정/주시/경고`) 동적화 |
| TimeSeriesStats 정적 mock | `TimeSeriesStats.tsx`를 `sessions`/`currentResults` 기반 데이터로 재작성. 저장된 분석 런 + 현재 워크스페이스 실측 포인트로 시계열/경보(Auditor)를 동적 생성. 세션 이력 부재 시에만 baseline 시나리오 폴백 |
| AuthScreen 평문 보안 | 데모 비밀번호를 localStorage 평문 대신 **Web Crypto SHA-256 해시**로 저장/검증 (레거시 평문 자동 마이그레이션). 하단 푸터에 `데모 로컬 인증 v1.1`·운영 배포 시 백엔드 인증 교체 필요 명시 |
| 빌드 청크 크기 경고 | `vite.config.ts`에 `manualChunks` vendor 분리(react/recharts/motion/lucide/misc). 메인 `index-*.js` 944 kB(gzip 284 kB) → 175 kB(gzip 48 kB) + vendor 청크 5종 캐시 분리 |
| IntegrationConsultant 정적 endpoint | 생성되는 Blueprint의 하드코딩 `node-coverage-analyzer.internal` 호스트를 `window.location.origin` 기반 실 endpoint(`/api/analyze`, `/api`)로 교체 |

### 검증 절차
- [x] `npm run lint` (`tsc --noEmit`) → **TypeScript: No errors found**
- [x] `npm run build` → 청크 분리 확인 (Circular chunk 경고 해소, `dist/server.cjs` 생성)
- [x] `npm run dev` 스모크 테스트 → `/api/health` `{"status":"ok"}`, 루트 `HTTP 200`

### 변경 파일
- `src/components/LocalFileUploader.tsx` [NEW]
- `src/utils/languageDetection.ts` [NEW]
- `src/App.tsx`
- `src/components/TimeSeriesStats.tsx`
- `src/components/AuthScreen.tsx`
- `src/components/IntegrationConsultant.tsx`
- `vite.config.ts`
- `docs/TODO.md`
- `docs/EVIDENCE.md`

### 결과 / 스크린샷
- 빌드 산출물 청크: `vendor-recharts 252 kB`, `vendor-react 194 kB`, `vendor-motion 129 kB`, `vendor-misc 175 kB`, `vendor-lucide 25 kB`, `index 175 kB` (각각 별도 gzip/캐시)

---

## IMP-006: 백엔드 구조 분리 + 타입 공유 + 클라이언트 훅 리팩토링 + Git URL SSRF 방어 (2026-08-08)

- **상태**: 완료
- **날짜**: 2026-08-08
- **작성자**: opencode
- **개선 목표**: 모놀리식 `server.ts`를 라우트/서비스 계층으로 분리하고, Gemini 응답 스키마를 프론트 타입과 단일 소스로 공유하며, 900줄대 `App.tsx`의 상태/핸들러를 전용 훅으로 추출하고, Git URL 검증(SSRF 방어)을 추가한다.

### 개선 내역

| 항목 | 내용 |
|------|------|
| 서버 구조 분리 | `server.ts`는 부트스트랩만(dev/prod 호스팅, listen, `PORT` env 지원) 담당. `server/app.ts`의 `createApp()`이 미들웨어/라우팅을 구성, `/api/health`, `/api/analyze`, `/api/optimize`, `/api/repo/scan`, `/api/repo/file` 라우터(`server/routes/*`)를 마운트 |
| Gemini 서비스 분리 | `server/services/gemini.ts`에 AI 클라이언트·`gemini-3.5-flash`·ANALYZE/OPTIMIZE 프롬프트·`responseSchema`·파싱 함수 `runAnalysisExtraction`/`runCoverageOptimization` 이관 |
| 타입 단일화 | `src/types.ts`에 `OptimizationInput`/`OptimizationResult` 공유 타입 추가, `AgenticOptimizer.tsx`의 인라인 `any` 타입 대체. 프론트와 서버 스키마 계약이 한 파일에 정착 |
| Git clone 서비스 | `server/services/repoClone.ts`의 `scanRepository`/`readRepoFile`/`ensureRepoCloned`로 이관 |
| Git URL SSRF 방어 | `assertSafeGitUrl`: http/https 허용, URL 자격 증명 금지, 기본 포트(80/443) 외 차단, `dns.lookup` 후 공인 IP만 허용(IPv4/IPv6 사설·링크로컬·루프백·멀티캐스트 차단) |
| 클라이언트 훅 추출 | `src/hooks/useAnalysisEngine.ts` [NEW]에 분석 상태/시뮬레이션 타이머/세션(localStorage)/API 호출 통합. `App.tsx`는 훅 소비만(뷰·JSX) 하도록 재작성, 외부 소스(Git/로컬 파일) 주입은 `handleExternalSource` 하나로 통합 |

### 검증 절차
- [x] `npm run lint` (`tsc --noEmit`) → **TypeScript: No errors found**
- [x] `npm run dev` 스모크 → `/api/health` `{"status":"ok"}`, 루트 `HTTP 200`
- [x] SSRF 차단 확인: `127.0.0.1`/`10.0.0.5`/`localhost` URL → "사설/로컬 주소… 허용되지 않음", 자격 증명 포함 URL → "자격 증명 포함 불가"
- [x] 공개 repo 실제 클론·스캔: `octocat/Hello-World` → `fileCount:1`, `entryCandidates:["README"]` 정상 반환

### 변경 파일
- `server.ts` (부트스트랩 리팩토링)
- `server/app.ts` [NEW], `server/routes/analyze.ts` [NEW], `server/routes/optimize.ts` [NEW], `server/routes/repo.ts` [NEW]
- `server/services/gemini.ts` [NEW], `server/services/repoClone.ts` [NEW]
- `src/hooks/useAnalysisEngine.ts` [NEW]
- `src/App.tsx` (훅 소비형으로 재작성)
- `src/types.ts`, `src/components/AgenticOptimizer.tsx`
- `docs/TODO.md`, `docs/EVIDENCE.md`

### 결과 / 스크린샷
- `server/routes/*` 3개 + `server/services/*` 2개 + `server/app.ts` 신설로 기존 모놀리식 `server.ts`의 책임이 분산됨
- `src/hooks/useAnalysisEngine.ts`(약 480줄) 신설, `src/App.tsx`는 JSX 중점으로 축소
- SSRF 검증 로그: private/loopback URL은 차단되고, 공인 Git URL은 클론/스캔 성공

---

## IMP-007: 저장소 배치(다중 파일) 분석 + 리포트 내보내기 + 서버 세션 인증 + 풀 스위트 누적 버그 (2026-08-08)

- **상태**: 완료
- **날짜**: 2026-08-08
- **작성자**: opencode
- **개선 목표**: TODO 백로그 재개 후 (1) 풀 테스트 스위트 순차 애니메이션의 커버리지 누적 버그, (2) Git 저장소 다중 파일 통합(배치) 분석, (3) 분석 결과 리포트(JSON/Markdown) 내보내기, (4) 데모 localStorage 인증을 서버 세션 인증으로 교체, (5) 문서 정리·하드코딩 라벨 해소를 일괄 진행한다.

### 개선 내역

| 항목 | 내용 |
|------|------|
| 풀 테스트 스위트 누적 버그 수정 | `useAnalysisEngine.ts`의 `handleSimulateNodeExecution`·`handleResetCoverage`가 stale closure(`analysisResults`)를 참조해 **풀 스위트 애니메이션 중 커버리지가 누적되지 않고 마지막 노드만 covered** 되는 문제를 `setAnalysisResults(기능 업데이트)`로 수정 |
| 저장소 배치(다중 파일) 통합 분석 | 서버 `POST /api/analyze/batch`(최대 12개·700KB 제한) 신설, `runBatchAnalysisExtraction`/`BATCH_ANALYZE_SYSTEM_PROMPT`/`normalizeBatchResult`(파일줄기 접두 id 정규화 + `sourceFile` 태깅), `repoClone.readRepoFiles` 다중 읽기 추가. 클라이언트 `MultiFileGitAnalyzer`에 체크박스 다중 선택·전체 선택·배치 실행 UI, `useAnalysisEngine.handleBatchAnalyzeCode`(성공 시 병합 결과 로드, 실패 시 per-file 폴백 병합) |
| 분석 결과 리포트 내보기 | `src/utils/reportExport.ts` [NEW] — 현재 분석(코드/CFG/RTM/커버리지/최적화)을 JSON·Markdown 파일로 다운로드. 헤더에 JSON/MD 내보내기 버튼 추가 |
| 백엔드 인증 연동 | `server/services/auth.ts` [NEW]: HMAC-SHA256 서명 토큰(sign/verify, 만료), SHA-256 해시 자격 검증, `server/routes/auth.ts` [NEW]: `POST /api/auth/login`·`GET /api/auth/me`. `/api/health`·정적 자산을 제외한 모든 `/api/*`에 `requireAuth`(Bearer) 적용. `AuthScreen.tsx`를 서버 세션 기반으로 재작성(저장 토큰 재검증), 클라이언트 파처에 `Authorization` 헤더 주입 |
| 문서/README 정리 + 라벨 동적화 | `AGENTS.md`·`README.md`에 인증/batch/구조 변경 반영. `App.tsx` 하드코딩 `Core v4.2 (Docker)` → `src/constants.ts` `ENGINE_VERSION`(`Core v2.0.0 (Dev)`) |

### 검증 절차
- [x] `npm run lint` (`tsc --noEmit`) → **TypeScript: No errors found**
- [x] `npm run build` → client + `dist/server.cjs` 정상 생성
- [x] `npm run dev` 스모크: `/api/health` 정상, 로그인 정답 200/오답 401, `/api/auth/me` 200, 미인증 `/api/analyze`·`/api/analyze/batch`·`/api/repo/*` 모두 401
- [x] `node dist/server.cjs` 프로덕션 스모크: 루트 SPA 200, 로그인 200, 미인증 API 401 (정적/API 인증 분리 확인)
- [x] `/api/analyze/batch` 파라미터 검증: 빈 배열 → `400`

### 변경 파일
- `server/services/auth.ts` [NEW], `server/routes/auth.ts` [NEW], `server/app.ts` (auth route + requireAuth 가드)
- `server/services/gemini.ts` (batch), `server/services/repoClone.ts` (readRepoFiles), `server/routes/analyze.ts` (batch route)
- `src/utils/reportExport.ts` [NEW], `src/constants.ts` [NEW], `src/vite-env.d.ts` [NEW]
- `src/types.ts`, `src/hooks/useAnalysisEngine.ts`, `src/App.tsx`, `src/components/AuthScreen.tsx`, `src/components/MultiFileGitAnalyzer.tsx`
- `AGENTS.md`, `README.md`, `docs/TODO.md`, `docs/EVIDENCE.md`

