// 전역 상수 (헤더 라벨 등 UI 동적 값)
export const APP_NAME = "Node Coverage Analyzer";
export const APP_VERSION = "2.0.0";

// 헤더 상단 엔진 배너. 배포/실행 모드 식별용.
export const ENGINE_LABEL = import.meta.env.PROD ? `Core v${APP_VERSION}` : `Core v${APP_VERSION} (Dev)`;