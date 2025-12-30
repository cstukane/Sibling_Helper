# Suggestions to Improve plan.md (End‑User Focus)

## Structure & Navigation
- Add a short “For Parents” quick start (3 steps) and a “For Kids” intro with pictograms.
- Split technical details into `/docs/dev/*`; keep plan.md focused on features and outcomes.

## Scope & Clarity
- Fix MVP point values (e.g., 1–3) and show 2–3 example rewards with costs.
- Include a “What happens when…” section (offline, app reinstall, device change).

## UX & Content
- Use friendly labels: “Quest Complete!” and “Save for Reward”.
- Add a “Suggestions” panel for parents (sample quests based on age range).

## Accessibility
- Provide a high‑contrast theme toggle and larger tap target mode.
- Respect `prefers-reduced-motion` and offer a global “Quiet Mode”.

## Safety & Privacy
- Document PIN retry lockout and local‑only storage by default.
- Add an optional local backup/export (JSON) with a simple restore flow.

## Sync & Announcements (Optional)
- Clarify sync conflict policy (client‑wins for MVP) and frequency.
- Abstract announcement providers (Home Assistant / Chromecast) behind a single toggle.

## Testing & Acceptance
- Expand acceptance criteria with a parent approval flow and reward redemption edge cases.
- Add a demo data toggle to quickly populate a daily board for testing.
