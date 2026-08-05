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
