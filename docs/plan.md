# plan.md — Big Sibling Helper (Digital Quest Board)

## 0) TL;DR

A kid-friendly “quest board” web app that turns helpful big-sibling behaviors into fun quests with instant feedback (stars, sounds, progress), simple rewards (1-on-1 time, movie pick), and optional whole-home announcements (“Hear ye, hear ye!”). Local-first PWA, optional server sync, tasteful micro-animations (Framer Motion or GSAP).

---

## 1) Goals & Non-Goals

**Goals**

* Motivate positive big-sibling behavior with clear, simple quests.
* Make success obvious: confetti, sounds, progress bar, streaks.
* Be usable one-handed on a phone; also nice on a tablet/kitchen display.
* Private by default: runs local-first; sync to server is optional.
* Parent controls: add/edit quests, set rewards, approve completions.

**Non-Goals (MVP)**

* No multi-household accounts or social features.
* No complex economy (keep points simple).
* No mandatory cloud. App must run offline as a PWA.

---

## 2) MVP Feature List

* **Profiles**: at least one “Hero” (older sibling) with name + avatar.
* **Quest Library**: predefined (e.g., “Bring a diaper”, “Quiet for 10 mins”), plus custom.
* **Daily Board**: 3–6 active quests shown like a game board.
* **Complete Quest**: tap → animation + star + SFX + progress bar fill.
* **Rewards**: parent-defined rewards with point costs; redeem flow requires parent passcode.
* **Parent Mode**: lockable section to add quests/rewards, adjust points, see history.
* **Offline-first PWA**: installable; IndexedDB for data; background sync when available.
* **Accessibility & Vibe**: large tap targets, springy progress, confetti on milestones.

**Stretch (Phase 2)**

* Streaks & badges; “daily quest rotation.”
* Multi-kid profiles with per-kid boards.
* Advanced reward types (timed tokens; bonus multipliers).
* **Home announcement** integration (Google/Alexa/Chromecast) via local network bridge or Home Assistant.
* Optional CSV/Markdown export.

---

## 3) Tech Stack

* **Frontend**: React + **Framer Motion** (or GSAP), Vite/Next.js, PWA (Workbox).
* **Data**: Local IndexedDB (Dexie.js). Optional server sync with SQLite/Postgres.
* **Backend (optional)**: FastAPI (Python) or Node/Express + SQLite/Postgres; REST JSON.
* **Audio**: WebAudio API for SFX (local assets).
* **Deployment**: Netlify/Vercel **or** Docker (Pi 5 or home server).

---

## 4) Architecture Overview

* **Local-first**: UI reads/writes to IndexedDB. A `syncService` pushes changes to `/api/*` if configured.
* **Auth (optional)**: local 4-digit parent PIN; if cloud, JWT with email/pass or device token.
* **Announcement Bridge (Phase 2)**:

  * Easiest: **Home Assistant** `tts.cloud_say` / `tts.google_say` to speakers on LAN.
  * Or **pychromecast** to cast a short TTS MP3 to Google/Nest speakers.
  * Or Alexa Routine via webhook (requires third-party connector).

---

## 5) Data Model (JSON Schemas)

```json
// hero.json
{
  "id": "uuid",
  "name": "string",
  "avatarUrl": "string|null",
  "points": 0,
  "streakDays": 0,
  "createdAt": "iso",
  "updatedAt": "iso"
}
```

```json
// quest.json
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "category": "helping|quiet|kindness|custom",
  "points": 1,
  "durationHintMin": 0,
  "active": true,
  "createdAt": "iso",
  "updatedAt": "iso"
}
```

```json
// dailyBoardItem.json
{
  "id": "uuid",
  "questId": "uuid",
  "date": "YYYY-MM-DD",
  "heroId": "uuid",
  "completedAt": "iso|null"
}
```

```json
// reward.json
{
  "id": "uuid",
  "title": "string",
  "cost": 5,
  "description": "string|null",
  "active": true
}
```

```json
// redemption.json
{
  "id": "uuid",
  "heroId": "uuid",
  "rewardId": "uuid",
  "pointsSpent": 5,
  "redeemedAt": "iso",
  "notes": "string|null"
}
```

---

## 6) API Contract (if server enabled)

**GET /api/hero** → list heroes
**POST /api/hero** → create hero
**PATCH /api/hero/\:id** → update hero points, streak

**GET /api/quests** → list quests
**POST /api/quests** → create
**PATCH /api/quests/\:id** → update

**GET /api/board?date=YYYY-MM-DD\&heroId=** → daily board
**POST /api/board/complete** `{ boardItemId }` → marks complete; returns updated hero points

**GET /api/rewards** / **POST** / **PATCH**
**POST /api/redeem** `{ rewardId, heroId }` → decrements points

**POST /api/announce** `{ text }` → triggers local announcement bridge (Phase 2)

---

## 7) UX Flows

* **Home (Kid Mode)**: Header (XP bar + avatar) → QuestGrid (cards). Tap card → “Complete” button → burst animation (star shower) → audible “quest complete!” → XP increments with elastic motion → optional “Announce!” button (Phase 2).
* **Parent Mode** (PIN): toggle in header → Manage Quests (CRUD), Rewards (CRUD), History (filter by day/week), Settings (PIN, sound on/off, announcement target).

**Vibe / Motion Notes**

* Use **layout animations** on grid changes; **spring** on XP bar; **confetti** on level-ups (`canvas-confetti` or custom).
* SFX short and delightful; respect a “quiet mode.”

---

## 8) Security & Privacy

* Private by default; no PII beyond kid name/avatar.
* Local PIN gate for parent actions.
* If cloud sync: encrypt in transit (TLS), restrict CORS, rotate JWTs. Offer “anonymize hero” toggle.

---

## 9) Testing & Acceptance

**Unit**: reducers/selectors; points math; date logic.
**E2E**: complete quest, offline, refresh, points persist, redeem reward path (Cypress/Playwright).
**Acceptance Criteria (MVP)**

* Installable PWA; works offline.
* Kid can complete at least 3 visible quests; sees animation/SFX; points increase.
* Parent can add a custom quest and a reward; redeem reduces points with PIN.

---

## 10) Project Structure

```
/app
  /src
    /components   // QuestCard, ProgressBar, ConfettiLayer, PinPad, RewardShop
    /pages        // Home, Parent, Settings
    /state        // heroSlice, questsSlice, boardSlice
    /data         // db.ts (Dexie), repositories
    /services     // syncService, announceService (Phase 2)
    /assets       // sfx, icons
  /public         // manifest.json, icons
server/ (optional)
  /src            // FastAPI or Node endpoints
infra/
  docker-compose.yml
docs/
  plan.md
```

---

## 11) Delivery Plan

**Week 1**: Skeleton app, PWA setup, IndexedDB, Quest grid, Complete flow (no reward shop).
**Week 2**: Progress/XP, Parent mode CRUD, Rewards & redemption.
**Week 3**: Polish (animations, SFX, confetti), accessibility, tests, optional server sync.
**Phase 2**: Announcement bridge, streaks/badges, multi-kid.

---

## 12) Open Questions

* Single hero or multiple on Day 1? (Recommend single to keep scope tight.)
* Points per quest: fixed (1–3) or variable? (Start fixed.)
* Announcement target preference: Home Assistant vs Chromecast vs Alexa routine?
