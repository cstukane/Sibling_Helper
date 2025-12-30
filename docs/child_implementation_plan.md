# Child App — Improvement Plan (Single Markdown Spec)

> Goal: ship a cohesive UX pass that tightens navigation, fixes Dark Mode, simplifies confirmations, and adds accountability views. Designed to be tech-agnostic (React Native / Flutter / web), with concrete copy, flows, and acceptance criteria.

---

## 0) Scope & Guardrails

* **Out of scope:** server-side rewards logic, parent app UI beyond linking code.
* **Non-breaking:** reuse existing data where possible; migrate settings if keys change.
* **Perf & size:** no heavy libs just for a hamburger; leverage built-in icons/components.
* **A11y:** WCAG AA minimum, keyboard/focusable, VO/TalkBack labels.

---

## 1) Move “Settings” to Hamburger (top-left)

### UX

* Replace centered Settings button with a **top-left hamburger** icon in the app header.
* Drawer contents (order):

  1. **Home**
  2. **Tasks**
  3. **Pending Submissions** *(new; see §6)*
  4. **Settings**
  5. **Help**
  6. **Log out**

### Copy

* Tooltip/label: `Menu`
* A11y label: `Open navigation menu`

### Implementation Notes

* Show hamburger on all primary screens.
* Drawer slides from left; 70–80% width on phone; persists as overlay (not pushing layout).
* Restore last-opened tab on app resume.

### Acceptance Criteria

* [x] Old "Settings" control removed from content area.
* [x] Hamburger is reachable, labeled for screen readers, and works offline for local screens.

---

## 2) Settings: Link to Parent App via Code

### User Story

> As a child user, I can enter a short code to link my account to the parent app.

### Flow

Settings → **“Link to Parent”** → code entry → submit → success/failure.

### Copy

* Title: `Link to Parent`
* Field placeholder: `Enter 6-digit code`
* CTA: `Link`
* Success: `You're linked!`
* Error (invalid/expired): `That code didn't work. Check with your parent and try again.`

### Validation

* Client: digits only, length = 6 (configurable).
* Server: verify code, one-time use, returns `parent_id`.

### Telemetry (event name → props)

* `link_parent_attempt` → `{length, source:'settings'}`
* `link_parent_success` → `{parent_id_hashed}`
* `link_parent_failure` → `{reason}`

### Acceptance Criteria

* [x] Codes trimmed, debounced (300–500ms).
* [x] Disabled CTA until valid pattern.
* [x] Handles offline: queue request and show `You're offline. We'll try again automatically.`

---

## 3) Settings: Switch Active Child

### User Story

> As a family using one device, I can **switch which child is active** without logging out.

### UI

* Settings → **“Active Profile”** section with:

  * Current child (avatar, name, points).
  * **Change** button → modal/bottom sheet listing all children.
  * Optional **Add child** (if supported today).

### Copy

* Section Title: `Active Profile`
* Button: `Change`
* List item subtitle: `Total points: {points}`

### Data & Tech Notes

* Persist `active_child_id` locally.
* On switch: refresh queries scoped by child, invalidate caches.

### Acceptance Criteria

* [x] All app screens reflect the selected child within 1 navigation cycle.
* [x] Protected from race: prevent double taps; show spinner.

---

## 4) Fix Dark Mode

### Problem

Dark Mode currently applies only to borders and a few buttons.

### Strategy

* Move to **tokenized theming** with semantic roles:

  * `bg/surface/overlay`
  * `text/primary, text/secondary, text/inverse`
  * `accent/primary, accent/hover, accent/disabled`
  * `border/muted`
  * `state/success, state/warn, state/error`
* Replace every hardcoded color with tokens.
* Respect system theme and **in-app override**:

  * Settings → **Appearance**

    * `Use System`
    * `Light`
    * `Dark`

### Quick Audit Checklist

* [x] App background surfaces are dark (`bg.surface = #121212` equivalent)
* [x] Text maintains 4.5:1 contrast minimum
* [x] Cards/sheets use elevated overlays (e.g., 8–12% white overlay)
* [x] Inputs, list dividers, toasts themed
* [x] Icons/SVGs use `currentColor` or theme mapper
* [x] Status bar/nav bar styled

### Acceptance Criteria

* [x] Switching theme updates **all** first-party screens (no flash of unstyled content).
* [x] Snapshots for light/dark per key screen (home, tasks, submission detail, settings).

---

## 5) Confirmation Modal (on Submit Task) — Simplify

### Goals

* Reduce verbosity.
* Keep task name and earned points.
* Approval disclaimer either removed or **first-time only** education.

### New Copy (Default)

* **Title:** `Submit task?`
* **Body:** `{task_name}`
* **Secondary line (optional):** `Earn {points} points`
* **Buttons:** `Cancel` · `Submit`

### First-Time Education (one-time; per device)

* After first successful submit, show inline toast (not in modal):
  `Submissions need approval before points are added.`
  \[ ] “Don’t show again” (checked by default)

### Behavior

* `Submit` triggers create submission → optimistic UI to **Pending Submissions** (see §6).
* Disable `Submit` while request in flight; show spinner.

### Acceptance Criteria

* [x] Max two lines of body text; no dynamic paragraph wrapping.
* [x] Points appear only if available; gracefully hide if null.
* [x] One-time education tracked using local flag `approval_notice_dismissed = true`.

---

## 6) Pending Submissions (Child-visible)

### User Story

> As a child, I can see my past submissions and their status (approved/denied/pending).

### Navigation

* New screen: **Pending Submissions**
* Entry points:

  * Drawer item (see §1)
  * Post-submit success snackbar: `View pending`

### List UI

* Each row:
  **Title:** `{task_name}`
  **Meta:** `{submitted_at · points}`
  **Status chip:** `Pending | Approved | Denied`
* Tap → detail sheet:

  * Task, submitted evidence (if any: photo/text), status history, moderator note (if denied).

### Empty States

* No submissions: `Nothing here yet. Complete a task to see it show up!`

### Copy (status chips)

* `Pending` / `Approved` / `Denied`

### Data Model (client-side)

```ts
Submission {
  id: string
  child_id: string
  task_id: string
  task_name: string
  points: number | null
  status: 'pending' | 'approved' | 'denied'
  submitted_at: ISOString
  reviewed_at?: ISOString
  reviewer_note?: string
  attachments?: Attachment[]
}
```

### API (example)

* `GET /children/{child_id}/submissions?limit=50&cursor=…`
* `POST /children/{child_id}/submissions` `{task_id, note?, attachments?}`
* Realtime (optional): subscribe to `submission_status_updated`.

### Acceptance Criteria

* [x] List is scoped to **active child**.
* [x] Pull-to-refresh and cursor pagination supported.
* [x] Denied items show reviewer note (if provided).

---

## 7) Settings Screen — Final Layout

```
[ Header  ]  ← hamburger (top-left), title: Settings

Appearance
  • Theme: [ Use System | Light | Dark ]

Account
  • Active Profile: [ Child Name  ▸ ]
  • Link to Parent  ▸

About
  • Help & Support  ▸
  • Version: 1.4.0 (build 123)
  • Log out
```

---

## 8) QA Test Plan (High-level)

### Navigation & Profiles

* [ ] Hamburger visible on all main screens; VO reads “Open navigation menu”.
* [ ] Switching child updates Tasks, Pending Submissions, points display.
* [ ] Deep link reopens correct child context.

### Parent Linking

* [ ] Rejects non-digit input; disables CTA until 6 digits.
* [ ] Handles invalid/expired code gracefully.
* [ ] Success persists link and shows success toast.

### Dark Mode

* [ ] Full-screen backgrounds flip to dark; no white flashes.
* [ ] Inputs, overlays, modals, lists compliant.
* [ ] Icons legible; contrast ≥ 4.5:1 body, 3:1 large text.

### Confirmation Modal

* [ ] Modal shows `Submit task?`, task name, optional points.
* [ ] First-time approval toast shows **once** post-submit.
* [ ] Cancel/Submit work with hardware back and ESC/Enter.

### Pending Submissions

* [ ] Pending list reflects new item immediately after submit.
* [ ] Status updates when server approves/denies.
* [ ] Denied shows reviewer note if present.

### Offline

* [ ] Submissions queue offline; visible as `Pending (offline)` state.
* [ ] Retry on reconnect; deduplicate.

---

## 9) Analytics (suggested)

* `nav_menu_opened` → `{screen}`
* `settings_opened` → `{}`
* `appearance_changed` → `{mode:'system|light|dark'}`
* `active_child_switched` → `{child_id_hashed}`
* `submission_created` → `{task_id, points, offline:bool}`
* `pending_opened` → `{}`
* `link_parent_*` events from §2

---

## 10) Localization Keys (baseline)

```json
{
  "menu.open": "Open navigation menu",
  "settings.title": "Settings",
  "settings.linkParent": "Link to Parent",
  "settings.activeProfile": "Active Profile",
  "appearance.title": "Appearance",
  "appearance.useSystem": "Use System",
  "appearance.light": "Light",
  "appearance.dark": "Dark",
  "confirm.submit.title": "Submit task?",
  "confirm.submit.earn": "Earn {points} points",
  "confirm.cancel": "Cancel",
  "confirm.submit": "Submit",
  "toast.approvalOnce": "Submissions need approval before points are added.",
  "pending.title": "Pending Submissions",
  "pending.empty": "Nothing here yet. Complete a task to see it show up!",
  "status.pending": "Pending",
  "status.approved": "Approved",
  "status.denied": "Denied",
  "link.code.placeholder": "Enter 6-digit code",
  "link.code.cta": "Link",
  "link.code.success": "You're linked!",
  "link.code.failure": "That code didn't work. Check with your parent and try again."
}
```

---

## 11) Engineering Tasks (Checklist)

* [x] Replace centered Settings button with header hamburger + drawer routes.
* [x] Implement Settings screen layout (Appearance, Active Profile, Link to Parent).
* [x] Add theme tokens and refactor components to use semantic tokens.
* [x] Wire theme override with persistence and system theme listener.
* [x] Implement parent link code entry + API + telemetry + offline message.
* [x] Implement child switcher modal + store `active_child_id` + cache invalidations.
* [x] Replace confirmation modal copy/logic; implement first-time approval toast.
* [x] Build Pending Submissions list + detail + pagination + optimistic insert.
* [x] Add analytics events.
* [x] Add unit/UI tests for theme, modal, and list states.
* [x] A11y pass (labels, focus, large text scaling).
* [x] QA sign-off (see §8).

---

## 12) Rollout

* **Feature flags:** `ff_pending_submissions`, `ff_dark_theme_override`, `ff_parent_linking`
* **Phased release:** 10% → 50% → 100% over 72 hours with crash/ANR guardrails.
* **Comms (child-facing):** Changelog card on Home:
  `New: Pending Submissions, Dark Mode fixes, and an easier menu.`

---

## 13) Risks & Mitigations

* **Dark mode regressions** → snapshot tests; token lint step.
* **Multiple children confusion** → always show active child avatar/name in header.
* **Offline submissions duplication** → idempotency key on POST.
* **Abuse of link codes** → rate limit by device; codes expire in ≤ 10 minutes.

---

## 14) Appendix — Minimal Pseudocode (Illustrative)

```ts
// Theme
const ThemeContext = createContext({mode:'system'|'light'|'dark'});
const tokens = resolveTokens(mode);

// Submit Confirmation
function ConfirmSubmit({task, points, onConfirm}) {
  return Modal({
    title: t('confirm.submit.title'),
    body: [task.name, points ? t('confirm.submit.earn', {points}) : null],
    actions: [
      {label: t('confirm.cancel'), kind:'secondary'},
      {label: t('confirm.submit'), kind:'primary', onPress: onConfirm}
    ]
  });
}

// First-time approval toast
if (!storage.get('approval_notice_dismissed')) {
  toast(t('toast.approvalOnce'));
  storage.set('approval_notice_dismissed', true);
}
