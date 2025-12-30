# Agent_start.md — Big Sibling Helper (Digital Quest Board)

## 0) Mission

Build an **offline-first PWA** that gamifies “big sibling” helper tasks: a daily quest board, tap-to-complete with animation + sound, points, and a simple reward shop gated by a parent PIN. Local data first; optional server sync later.

## 1) Non-Negotiables (Guardrails)

* **Local-first**: IndexedDB is the source of truth in MVP.
* **Private by default**: no analytics, no third-party SDKs.
* **Kid-friendly UX**: large tap targets, readable type, quick feedback.
* **No blocking on cloud**: all MVP features work fully offline.
* **No sample code in docs**: create files via commands only.

## 2) Tech Choices (Pin These)

* **Runtime**: Node 20.x, PNPM.
* **Framework**: React + Vite.
* **Animations**: Framer Motion.
* **Data**: IndexedDB via Dexie.
* **PWA**: Workbox plugin (vite-plugin-pwa).
* **E2E**: Playwright.
* **Unit**: Vitest.
* **Lint/Format**: ESLint + Prettier.
* **Optional server (Phase 2+)**: FastAPI or Express; not required to ship MVP.

## 3) Repo Scaffolding (Run in a fresh directory)

> Create a feature branch first. Keep PRs small and reviewable.

```bash
pnpm create vite big-sibling-helper --template react-ts
cd big-sibling-helper
pnpm i
pnpm i dexie framer-motion
pnpm i -D vite-plugin-pwa @playwright/test vitest eslint prettier @types/dexie
```

Create directories (no code yet):

```
/docs
/src/components
/src/pages
/src/state
/src/data
/src/services
/src/assets/sfx
```

Add config stubs (empty files are fine to start):

```
/docs/plan.md                # (your existing plan)
 /docs/Agent_start.md         # (this file)
 /docs/ACCEPTANCE.md          # will hold acceptance tests
/src/data/db.ts               # Dexie schema
/src/state/{hero,quests,board}.ts
/src/services/{syncService,announceService}.ts
/public/manifest.webmanifest
```

## 4) Environment & Config

* No env vars needed for MVP (offline).
* If you add optional sync later, define:

  * `VITE_API_BASE_URL`
  * `VITE_ENABLE_SYNC` (boolean)

## 5) Initial Issue Set (Create these GitHub issues)

1. **PWA shell**: install vite-plugin-pwa; manifest; offline page; add service worker.
2. **Dexie schema**: heroes, quests, dailyBoardItems, rewards, redemptions.
3. **State slices**: hero, quests, board; selectors for “today’s board”.
4. **Quest Board UI**: grid of active quests; card layout.
5. **Complete Flow**: tap → animation + SFX + points increment.
6. **Progress/XP**: header progress bar + confetti on thresholds.
7. **Parent Mode (PIN)**: lock → CRUD quests/rewards; history view.
8. **Reward Shop**: view rewards → redeem (PIN).
9. **Accessibility pass**: focus order, ARIA, prefers-reduced-motion.
10. **E2E Happy Path (Playwright)**: complete quest offline, refresh, redeem.
11. **Unit tests (Vitest)**: reducers/selectors; points math; date logic.
12. **Docs**: fill `ACCEPTANCE.md` with test cases; update README.

## 6) Implementation Order (Exact Steps)

* **Step 1 — PWA & shell**

  * Add vite-plugin-pwa, webmanifest (name, icons, start\_url, display=standalone).
  * Cache strategy: app shell + static assets; **do not** cache API (none in MVP).
* **Step 2 — Data layer**

  * Define Dexie tables: `heroes`, `quests`, `board`, `rewards`, `redemptions`.
  * Seed: one hero, 4–6 stock quests, 2–3 rewards (local JSON).
* **Step 3 — State & selectors**

  * Today’s YYYY-MM-DD board selector.
  * Points & streak derived selectors.
* **Step 4 — Quest Board UI**

  * Card with title, points, duration hint (if any).
  * On tap → call `completeQuest(boardItemId)`.
* **Step 5 — Motion & SFX**

  * Framer Motion: springy progress bar; layout transitions on completion.
  * SFX: short chime on complete; confetti on N points milestone.
* **Step 6 — Parent Mode**

  * 4-digit PIN modal → toggles admin panels.
  * CRUD for quests & rewards; history list (by date).
* **Step 7 — Reward Shop**

  * Show available rewards; disable if insufficient points.
  * Confirm redeem → subtract points → store redemption record.
* **Step 8 — Tests**

  * Unit: selectors, reducers, points, date math.
  * E2E: offline completion, page refresh persistence, PIN-gated redeem.

## 7) Acceptance Criteria (copy these into `/docs/ACCEPTANCE.md`)

* App installs as PWA; loads offline after first visit.
* Home shows **3–6** quests for “today”.
* Tapping a quest triggers **visible animation** and **audible SFX** and increments points.
* Parent Mode requires a **PIN** to access Quest/Reward CRUD.
* Reward redemption subtracts points and records a redemption item.
* Refreshing the page **persists** state via IndexedDB.
* Playwright test covers: complete quest → points increase → redeem → points decrease.

## 8) Definition of Done

* Lighthouse PWA score ≥ 90; a11y ≥ 90.
* Prefers-reduced-motion respected (no confetti/SFX if off).
* No runtime errors; all tests green in CI.
* README updated with install/run/test instructions.

## 9) Phase 2 Backlog (do not block MVP)

* Streaks/badges, daily rotation.
* Multi-kid profiles.
* Announcement bridge to smart speakers (Home Assistant / Chromecast).
* CSV/Markdown export.
