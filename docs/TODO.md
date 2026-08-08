# 작업 할 일 목록 (Work TODO)

이 파일은 **다음 세션에서 이어서 진행할 수 있도록** 남기는 지속형 할 일 목록입니다.
완료된 항목은 `[x]`로 표시하고, 해당 작업이 모두 끝나면 목록을 비웁니다(초기화).

규칙:
- 하나의 항목은 하나의 구체적 작업.
- 완료 시 해당 줄을 `[x]`로 변경.
- 세션 종료 시 진행 중 항목의 메모를 남긴다.

---

## 진행 중 (Current)

- (없음)

---

## 백로그 (Backlog)

- (없음)

---

## 완료 (Completed)

- [x] **IMP-006: 백엔드 구조 분리 + 타입 공유 + 클라이언트 훅 리팩토링 + Git URL SSRF 방어** — `server.ts`→routes/services 분리, `src/types.ts` 공유 타입, `useAnalysisEngine.ts` 훅 신설, `assertSafeGitUrl` SSRF 방어. `docs/EVIDENCE.md` IMP-006 참조. (2026-08-08)

- [x] **IMP-001: 로컬 파일 선택/드래그앤드롭** — `LocalFileUploader.tsx` + 확장자 기반 언어 자동 판별(`utils/languageDetection.ts`) 추가. `docs/EVIDENCE.md` IMP-005 참조. (2026-08-07)
- [x] **기술 부채 지수 카드 하드코딩** — `src/App.tsx` stats memo에서 미커버 노드 비율+복잡도 기반 debt 실측 계산 + 세션 평균 대비 delta/badge 동적화. (2026-08-07)
- [x] **TimeSeriesStats 정적 mock** — 세션 이력 + 현재 워크스페이스 실측 데이터 기반 시계열/경보로 재작성. 이력 부재 시에만 baseline 폴백. (2026-08-07)
- [x] **AuthScreen 보안 수준** — 데모 비밀번호 localStorage SHA-256 해시 저장/검증(평문 레거시 자동 마이그레이션) + 데모 로컬 인증 명시. 운영 배포 시 백엔드 인증 연동은 후속 과제로 남김. (2026-08-07)
- [x] **빌드 청크 크기 경고** — `vite.config.ts` `manualChunks` vendor 분리로 메인 인덱스 944 KB(gzip 285 KB) → 175 KB(gzip 48 KB). (2026-08-07)
- [x] **IntegrationConsultant 정적 내용 검증** — 생성 Blueprint의 하드코딩 `node-coverage-analyzer.internal` 호스트를 `window.location.origin` 기반 실제 `/api/*` endpoint로 교체. (2026-08-07)

---

## 이전 완료 (Historical)

- [x] **미커밋 변경 사항 커밋** — AuthScreen + shadcn UI 도입(IMP-003) 커밋 `151c23f` → `origin/main` 푸시 완료. (2026-08-05)
- [x] **IMP-002: 정적 리뷰 후속 버그 수정** — `field.tsx` unknown 타입 에러, App.tsx Hooks 규칙 위반, Python 템플릿 문법, EC 실측, UTC Clock 동적화. `docs/EVIDENCE.md`의 IMP-002 참조. (2026-08-05)
