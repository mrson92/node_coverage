# 작업 할 일 목록 (Work TODO)

이 파일은 **다음 세션에서 이어서 진행할 수 있도록** 남기는 지속형 할 일 목록입니다.
완료된 항목은 `[x]`로 표시하고, 해당 작업이 모두 끝나면 목록을 비웁니다(초기화).

규칙:
- 하나의 항목은 하나의 구체적 작업.
- 완료 시 해당 줄을 `[x]`로 변경.
- 세션 종료 시 진행 중 항목의 메모를 남긴다.

---

## 진행 중 (Current)

- [ ] **미커밋 변경 사항 커밋**: `AuthScreen`(로그인 화면), shadcn 컴포넌트(`components/ui/*`), `components.json`, `lib/utils.ts`, `App.tsx` auth gate 반영. 단, 아래 Todo가 남아 있으면 커밋 전 결정 필요.
  - 메모: `git status` 기준 미커밋 작업 트리 상태 (2026-08-05).

---

## 백로그 (Backlog)

- [ ] **IMP-001: 로컬 파일 선택/드래그앤드롭 (미완)** — `docs/EVIDENCE.md` 참조. Git 연동으로 일부 해결됨. 브라우저 로컬 파일 선택 UI + 확장자 기반 언어 자동 판별 추가.
- [ ] **기술 부채 지수 카드 하드코딩** — `src/App.tsx` MetricCard `failure-rate` 값 `10.8 dS`가 정적. 실측 지표 또는 명시적 표시로 정리.
- [ ] **TimeSeriesStats 정적 mock** — `src/components/TimeSeriesStats.tsx`의 `TIME_SERIES_DATA`가 하드코딩. 실제 세션 이력 기반 시계열로 연동 검토.
- [ ] **AuthScreen 보안 수준** — `src/components/AuthScreen.tsx`가 localStorage 평문 비밀번호 + 하드코딩 데모 계정(`demo@nodecov.io`/`demo1234`). 데모용 표시를 명확히 하거나 백엔드 인증 연동 검토.
- [ ] **빌드 청크 크기 경고** — `dist/index-*.js` 944.12 kB (gzip 284.65 kB). `manualChunks` / 동적 import 코드 스플리팅 검토.
- [ ] **IntegrationConsultant 정적 내용 검증** — `src/components/IntegrationConsultant.tsx`이 실제 연동 데이터를 사용하는지 확인 필요.

---

## 완료 (Completed)

- [x] **IMP-002: 정적 리뷰 후속 버그 수정** — `field.tsx` unknown 타입 에러, App.tsx Hooks 규칙 위반, Python 템플릿 문법, EC 실측, UTC Clock 동적화. `docs/EVIDENCE.md`의 IMP-002 참조. (2026-08-05)
