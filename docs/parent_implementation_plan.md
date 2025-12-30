# Parent App — Improvement Plan (Single Markdown Spec)

> Goal: streamline creation/editing, fix Dark Mode, and support multi-child linking. Designed to be stack-agnostic (React Native / Flutter / web) with concrete copy, flows, and acceptance criteria.

---

## 0) Scope & Guardrails

* **Create a backup of the files that will be adjusted before making any edits:**

* **In scope:**

  * Merge **Quests** + **Chores** into one tab with optional Recurrence.
  * Convert inline creation forms into **Add…** pop-up modals (Chores & Rewards).
  * Sort/filter lists by default.
  * Dark Mode visual bugs incl. mobile outer border; **border color** setting.
  * Link to multiple child apps via **6-digit PIN**.
* **Out of scope (for now):** Full redesign of **Profile** tab/home.
* **A11y:** WCAG AA, large-text support, screen reader labels.

---

## 1) Navigation & Tabs

**Tabs (left-to-right):** `Home` · `Tasks` (merged Quests/Chores) · `Rewards` · `Profile` · `Settings`

* Rename merged tab to **Tasks** (parent-facing clarity).
* Keep deep links from legacy routes and redirect:

  * `/quests` → `/tasks`
  * `/chores` → `/tasks?view=recurring`

**Acceptance Criteria**

* Old links continue to work via redirect.
* No visual regressions on tab order/labels.

---

## 2) Merge Quests + Chores into “Tasks”

### Concept

* A **Task** becomes the single object type.
* If **Recurrence** is **selected**, the task is displayed as a **Chore** (recurring).
* If **Recurrence** is **not set**, it’s displayed as a **Quest** (one-time).

### Default View (List-first)

* **Header button:** `Add Task`
* **Controls (top row):**

  * **Filter**: `All | Quests | Chores`
  * **Sort**: `Recently updated | Points | A→Z | Z→A`
  * **Search** (placeholder: `Search tasks…`)
* **List** shows existing items; supports infinite scroll or paging.

### Add/Edit Modal (Pop-up)

* Triggered via **Add Task** (top) or edit icon on list item.
* **Fields**:

  * Title (required)
  * Description (optional)
  * Category (optional)
  * Points (required, numeric)
  * **Recurrence** (optional): `None` (default), `Daily`, `Weekly`, `Monthly`, `Custom…`
* **Buttons**: `Cancel` · `Save`
* **Status**: show spinner on save; disable while in flight.

### Copy

* Button: `Add Task`
* Empty state: `No tasks yet. Create your first one.`
* Chips/Badges in list: `Quest` (no recurrence) / `Chore` (has recurrence)

### Data Model (server/client)

```ts
Task {
  id: string
  title: string
  description?: string
  category?: string
  points: number
  // If recurrence is null/undefined => Quest
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
    rule?: string // e.g., RFC5545 RRULE if supported
  }
  updated_at: ISOString
  created_at: ISOString
}
```

### Acceptance Criteria

* Creating a task without recurrence renders as **Quest**.
* Adding any recurrence renders as **Chore**.
* Sort, filter, and search operate client-side with server pagination support.
* Edit modal loads the existing values; **Save** updates list in place.

---

## 3) Rewards Tab — Modal-First Create/Edit

### Default View (List-first)

* **Header button:** `Add Reward`
* Controls: **Sort** (`Point cost ↑/↓`, `A→Z`, `Recently updated`) · **Search**

### Add/Edit Modal

* **Fields**:

  * Title (required)
  * Description (optional)
  * Point Cost (required, numeric)
* **Buttons**: `Cancel` · `Save`

### Post-Save Behavior

* Close modal.
* Show toast: `Reward saved.`

### Acceptance Criteria

* Prior inline form removed from page body.
* List updates immediately after create/update.
* Toast appears and dismisses automatically (3–4s) and on swipe.

---

## 4) Dark Mode & Mobile Border

### Issues

* Dark mode leaves a light **outer border** on mobile.
* Desire to **customize** that border color.

### Fix Plan

* Ensure root containers extend to device edges and inherit theme background.
* Add theme **token**: `frame.border` (outermost ring) with light/dark values.
* Expose **Settings → Appearance → Border Color** (parent-configurable override) affecting `frame.border`.

### Settings → Appearance

* `Use System | Light | Dark`
* **Border Color**: color picker or presets (`System default`, `Slate`, `Graphite`, `Indigo`, `Emerald`, `Rose`)

### Acceptance Criteria

* No visible light gutter in Dark Mode on notched/rounded devices.
* Changing **Border Color** updates the frame immediately.
* Contrast meets AA where border abuts actionable UI.

---

## 5) Settings — Link Multiple Child Apps (6-digit PIN)

### User Stories

* As a parent, I can **link** to a child app by entering a **6-digit PIN**.
* I can manage **multiple children** (add/remove/view).

### UI

* **Linked Children** section:

  * List of linked child profiles (avatar, name, current points).
  * `Link New Child` button → **PIN modal**.
  * Per-child overflow menu: `Rename locally`, `Unlink`, `View in Child App` (deep link if applicable).

### PIN Modal

* Title: `Link Child App`
* Field: `Enter 6-digit PIN`
* Buttons: `Cancel` · `Link`

### Copy/States

* Success toast: `Child linked.`
* Failure: `That code didn't work. Try again or check the child device.`
* Offline: `You're offline. We'll link automatically when you're back online.`

### Acceptance Criteria

* Supports unlimited children (or product-level limit) without UI breakage.
* PIN validation client-side (digits/length) plus server verification.
* All task/reward views become **scoped** by selected child (global selector in header if needed).

---

## 6) Profile Tab (Minimal Change for Now)

* Keep existing layout.
* Add **child selector** control if more than one linked child to make the current scope obvious (avatar + name “switch” affordance).
* Minor copy polish:

  * Title: `Profile`
  * Subtitle shows selected child: `Viewing: {Child Name}`

---

## 7) Lists: Sorting & Filtering Details

* **Tasks**:

  * Filter: `All | Quests | Chores`
  * Sort: `Recently updated (default) | Points | A→Z | Z→A`
* **Rewards**:

  * Sort: `Point cost ↑/↓ | A→Z | Recently updated`
* **Search** across title + description; debounce 300–500ms.
* Persist last used sort/filter per tab.

**Acceptance Criteria**

* Empty results show friendly empty states (not blank).
* Sort indicators reflect current choice; keyboard focus lands on first result after changes.

---

## 8) Copy & Localization Keys

```json
{
  "tabs.tasks": "Tasks",
  "tasks.add": "Add Task",
  "tasks.search.placeholder": "Search tasks…",
  "tasks.type.quest": "Quest",
  "tasks.type.chore": "Chore",
  "tasks.empty": "No tasks yet. Create your first one.",
  "field.title": "Title",
  "field.description": "Description",
  "field.category": "Category",
  "field.points": "Points",
  "field.recurrence": "Recurrence",
  "recurrence.none": "None",
  "recurrence.daily": "Daily",
  "recurrence.weekly": "Weekly",
  "recurrence.monthly": "Monthly",
  "recurrence.custom": "Custom…",
  "button.cancel": "Cancel",
  "button.save": "Save",

  "tabs.rewards": "Rewards",
  "rewards.add": "Add Reward",
  "toast.rewardSaved": "Reward saved.",

  "settings.title": "Settings",
  "settings.linkedChildren": "Linked Children",
  "settings.linkChild": "Link New Child",
  "settings.appearance": "Appearance",
  "settings.theme.useSystem": "Use System",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.borderColor": "Border Color",

  "pin.title": "Link Child App",
  "pin.placeholder": "Enter 6-digit PIN",
  "pin.link": "Link",
  "pin.error": "That code didn't work. Try again or check the child device.",
  "pin.success": "Child linked.",
  "offline.queue": "You're offline. We'll link automatically when you're back online."
}
```

---

## 9) Engineering Tasks (Checklist)

* **Tasks tab**

  * [x] Create merged **Tasks** route; migrate/redirect legacy paths.
  * [x] Implement list-first layout with sort/filter/search.
  * [x] Build **Add/Edit Task** modal; wire recurrence → chore classification.
  * [x] Remove inline creation UI from page body.

* **Rewards tab**

  * [x] Replace inline form with **Add/Edit Reward** modal.
  * [ ] Add toast on save; update list.

* **Settings**

  * [x] Implement **Linked Children** manager (list, link, unlink).
  * [x] Add **PIN** modal + API integration + offline queue.
  * [x] Add **Appearance** section with theme + **Border Color** override.

* **Theming**

  * [x] Add token `frame.border`; ensure edge-to-edge backgrounds.
  * [x] Audit dark mode across all parent screens.

* **State/Scope**

  * [ ] Global `selectedChildId` state; all data queries respect it.
  * [ ] Header child selector when multiple children exist.

* **Analytics**

  * [x] `tasks_add_opened`, `task_saved`, `task_filtered`, `task_sorted`
  * [x] `rewards_add_opened`, `reward_saved`
  * [x] `link_child_attempt/success/failure`, `child_scope_changed`
  * [x] `appearance_changed`, `border_color_changed`

* **Testing**

  * [x] Unit tests: recurrence logic, sorting, filtering, PIN validation.
  * [x] UI tests: modal open/close, toasts, dark mode edges.
  * [ ] Snapshot tests: light/dark variants for key screens.

---

## 10) QA Test Plan (High-Level)

### Tasks

* [x] Creating with **Recurrence=None** labels item as **Quest**.
* [x] Creating with any recurrence labels item as **Chore**.
* [x] Edit preserves classification when unchanged; toggling recurrence flips label.
* [x] Sort + filter interplay behaves correctly (e.g., filter=Chores then sort=Points).

### Rewards

* [x] Modal opens/closes correctly on create/edit.
* [ ] `Reward saved.` toast appears and disappears as expected.

### Multi-Child Linking

* [x] Valid PIN links child and appears in list.
* [x] Unlink removes child; data scope switches gracefully.
* [ ] Switching active child updates Tasks and Rewards immediately.

### Dark Mode & Border

* [x] No light gutter at device edges in Dark Mode.
* [x] Border color changes take effect instantly; persists on relaunch.

### Accessibility

* [ ] Screen reader labels for `Add Task`, `Add Reward`, `Link New Child`.
* [ ] Focus management returns to the triggering control after modal closes.
* [ ] Large text: modals and lists remain usable without clipping.

---

## 11) Risks & Mitigations

* **Classification confusion (Quest vs Chore):** show small badge and hover/help text on Recurrence field: “Set a recurrence to make this a Chore.”
* **Dark edge on some devices:** ensure safe-area handling and root host view matches theme background.
* **Scope bugs with multiple children:** centralize data selectors by `selectedChildId`; add e2e tests for switching.

---

## 12) Minimal Pseudocode (Illustrative)

```ts
// Derived type from recurrence
function taskType(task: Task): 'quest' | 'chore' {
  return task.recurrence && task.recurrence.type !== 'none' ? 'chore' : 'quest';
}

// Add/Edit modal (shared for create/edit)
function TaskModal({initial, onClose}) {
  const [form, setForm] = useState(initial ?? {recurrence:{type:'none'}});
  const saving = useSaving();

  return Modal({
    title: initial ? 'Edit Task' : 'Add Task',
    body: Form({
      fields: [
        Input('Title', {required:true, value:form.title}),
        TextArea('Description', {value:form.description}),
        Input('Category', {value:form.category}),
        Number('Points', {required:true, value:form.points}),
        Select('Recurrence', ['None','Daily','Weekly','Monthly','Custom…'], {value:form.recurrence?.type ?? 'None'})
      ],
      onChange: setForm
    }),
    actions: [
      {label:'Cancel', onPress:onClose},
      {label:'Save', disabled:saving || !form.title || !form.points, onPress:saveTask}
    ]
  });
}

// Border color override token
const tokens = {
  frame: {
    border: userPref.borderColor ?? (isDark ? '#000000' : '#FFFFFF')
  }
};
```

---

## 13) Migration Notes

* Backfill existing **Quests**/**Chores** into unified `Task` schema:

  * Quests → `recurrence.type = 'none'`
  * Chores → `recurrence.type = inferred (daily/weekly/…)` or `'custom'` with RRULE if present.
* Maintain old IDs; add a `kind_migrated_from?: 'quest'|'chore'` field for analytics.
