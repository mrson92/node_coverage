# AGENTS.md

Node Coverage Analyzer — an AI Studio applet: a multi-language (JS/Python/Java/C++) control-flow-graph (CFG) coverage analyzer. React 19 frontend + a single Express server that both hosts the app and provides the Gemini-backed API and Git repo scanning.

## Commands

- `npm run dev` — full-stack dev: `tsx server.ts` runs an Express server on **port 3000** that mounts Vite middleware in non-production mode. This is the correct way to run + iterate (file edits hot-reload both FE and BE).
- `npm run build` — `vite build` (client to `dist/`) then `esbuild server.ts ... --outfile=dist/server.cjs` (backend bundle).
- `npm start` — runs the built backend `node dist/server.cjs`. For production behavior (static hosting instead of Vite middleware) set `NODE_ENV=production`. Requires a prior `npm run build`.
- `npm run lint` — **this is the type-checker** (`tsc --noEmit`); there is no separate typecheck script and **no test suite**. Use it to verify changes.
- `npm run clean` — removes `dist` and a stale `server.js`.

## Environment

- Requires `GEMINI_API_KEY` (and optionally `APP_URL`). README says to put it in `.env.local`; `server.ts` calls `dotenv.config()`. Copy from `.env.example`. AI Studio injects these at runtime from user secrets — don't hardcode keys.
- Gemini calls happen **server-side only** (`metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`). Never invoke the Gemini SDK from the client; the frontend talks only to `/api/*`.
- The `git` binary must be present at runtime — `/api/repo/scan` and `/api/repo/file` shallow-clone repos into `.repo-cache/` (gitignored) via `child_process.execFile`.

## Architecture

- `server.ts` is the single backend. Its API endpoints: `/api/health`, `/api/auth/login`, `/api/auth/me`, `/api/analyze`, `/api/analyze/batch` (multi-file repo batch), `/api/optimize`, `/api/repo/scan`, `/api/repo/file`. The Gemini model used is `gemini-3.5-flash`; responses use strict `responseSchema` — keep both prompt and schema in sync with `src/types.ts` (`AnalysisResults`, `CFGNode`, `CFGEdge`, `RepoFileEntry`, `BatchSourceFile`, etc.).
- All `/api/*` except `/api/health` and `/api/auth/*` require `Authorization: Bearer <token>` obtained from `POST /api/auth/login` (HMAC-SHA256 signed, server-side credential check in `server/services/auth.ts`). Demo account `demo@nodecov.io`/`demo1234`.
- Frontend lives in `src/` (`App.tsx`, `components/`, `data/`, `types.ts`, `main.tsx`, `index.css`). Components fetch `/api/analyze`, `/api/optimize`, `/api/repo/*` directly (see `MultiFileGitAnalyzer.tsx`).
- Path alias `@/*` → repo root (set in both `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`), so imports look like `@/components/...`.
- `dist/` is build output (client assets + `server.cjs`). Do not edit; regenerate via `npm run build`.
- `docs/EVIDENCE.md` is a running improvement/changelog log with `IMP-XXX` entries (Korean); record meaningful changes there following its template.

## Gotchas / conventions

- Do **not** modify the `server.hmr` / `server.watch` settings in `vite.config.ts` — comments in the file explain they exist to avoid flicker/CPU usage during agent edits (`DISABLE_HMR`, ignoring `.repo-cache`).
- Skip `node_modules/`, `dist/`, `.repo-cache/` when searching/editing — they are build/runtime artifacts.
- `src/data/` contains `fallbackResults.ts` and `mockTemplates.ts` (mock/demo data used when API is unavailable) — keep the shape aligned with `src/types.ts`.
- `npm run lint` (`tsc --noEmit`) is the gate for accepting a change.