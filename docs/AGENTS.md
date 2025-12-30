# Repository Guidelines

## Project Structure & Modules
- Root docs: `plan.md`, `agent_start.md` (vision, roadmap).
- App (expected): `/app/src/{components,pages,state,data,services,assets}` with PWA assets in `/app/public`.
- Optional server: `/server/src` (FastAPI or Express) for sync APIs.
- Infra: `/infra` for Docker and deployment.
- Tests: unit under `/app/src/**/__tests__` or `*.test.ts`; E2E in `/app/e2e`.

## Build, Test, and Dev
- `pnpm dev`: start Vite dev server.
- `pnpm build`: production bundle.
- `pnpm preview`: serve built app locally.
- `pnpm test`: run Vitest unit tests.
- `pnpm test:e2e`: run Playwright E2E.
- `pnpm lint` / `pnpm format`: ESLint and Prettier.
Example first‑run: `pnpm i && pnpm dev`.

## Coding Style & Naming
- Language: TypeScript + React.
- Formatting: Prettier (2‑space indent, semicolons on, single quotes).
- Linting: ESLint with React/TS rules; fix on save preferred.
- Components: `PascalCase` files in `/components` (e.g., `QuestCard.tsx`).
- Hooks/utils: `camelCase` (e.g., `useBoard.ts`, `dateUtils.ts`).
- Folders and assets: `kebab-case`.
- Keep modules focused; colocate tests and styles with components when small.

## Testing Guidelines
- Frameworks: Vitest (unit), Playwright (E2E).
- Test files: `*.test.ts[x]` or `*.spec.ts[x]` next to source or in `__tests__`.
- Coverage target: ≥80% lines for core logic (`state`, `data`).
- E2E must cover: offline complete‑quest flow, points increment, reward redeem.
- Run locally: `pnpm test && pnpm test:e2e` before PRs.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits, e.g., `feat: add reward redemption`, `fix(state): correct points calc`.
- Scope small and atomic; include rationale in body when non‑trivial.
- PRs: link issues, describe behavior and risks, include screenshots or short clips for UI, and note test coverage changes.
- Checklist: tests pass, lint/format clean, docs updated (`README`, `docs/`).

## Security & Configuration
- MVP is offline‑first. If enabling sync, use env vars: `VITE_API_BASE_URL`, `VITE_ENABLE_SYNC`.
- Do not commit secrets or API tokens; prefer `.env.local` (git‑ignored).
- Respect privacy: no analytics or third‑party SDKs without review.

## Architecture Overview (Quick)
- Local‑first PWA using IndexedDB (Dexie) with optional background sync to `/api/*`.
- Motion via Framer Motion; keep interactions fast, accessible, and kid‑friendly.
