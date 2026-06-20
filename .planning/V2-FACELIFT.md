# v2 Facelift — status

**Branch:** `feat/v2-claude-design-facelift` · started 2026-06-20

**Goal:** import the Claude Design HTML export's polish (`from claude design
SampleAcademy-handoff.zip`, extracted to `_claude-design-import/`) into the Remotion
pipeline and ship a **v2** of all 7 gate-green lessons + the sizzle, beside the
v1 originals in the repo and Drive. Render-layer only — content, audio, and
per-scene durations are unchanged.

## What changed
- `src/brand/tokens.ts` — v2 surface tokens (card-white `#FDFBF9`, alt/dark linen,
  muted/dim ink, borders, accentSoft) + 3-level `SHADOW` system + `radiusWindow`.
- `src/compositions/lesson-scenes/primitives.tsx` (new) — `Tether`, `Pinwheel`,
  `TypeOn`, `PulseRing`, `MockCursor`, `Window`, `Composer` (frame-driven, tested).
- `LessonChrome.tsx` (new) + wired into `LessonVideo` — wordmark / label / progress
  dots / counter, inside SAFE_AREA.
- All 17 lesson scenes + 4 sizzle shells restyled to the v2 look.
- `scripts/render-lesson.ts` — `RENDER_OUT_DIR` override (→ `out/v2`).
- `scripts/publish-to-drive.ts` — `--v2` mode (publishes `N.M Video v2.mp4` beside v1).
- Skill doc: `.claude/skills/animated-lesson/references/09-v2-remotion-realization.md`.

## Verification
- 489 unit tests green; typecheck + lint clean.
- `gate:layout` PASS (0 violations) on **all 7** lessons.
- v2 stills reviewed for every used scene type — production-grade, on-brand.

## Status / remaining — COMPLETE (2026-06-20)
- [x] Full v2 MP4 render of 7 lessons → `out/v2/` (7/7, 0 failures).
- [x] Duration parity verified: every v1↔v2 MP4 duration identical to the µs
      (audio stays in sync) — proves render-layer-only.
- [x] Visual MP4 spot-checks — comparison-chats (windows+tether+chrome),
      quote-card, etc. render the v2 look in the actual MP4s.
- [x] Sizzle v2 render (16:9 + 9:16) → `out/v2/sizzle-16x9.mp4` / `sizzle-9x16.mp4`
      (payoff rebuilt from a v2 lesson clip).
- [x] Published to Drive: all 7 as `N.M Video v2.mp4` beside v1 in each Lesson
      folder; both sizzle cuts in `00 — START HERE/` as `… Sizzle Reel v2[.../ (Vertical)].mp4`.

## Follow-up polish (optional, non-blocking)
- Sizzle "Content" beat reads a touch sparse mid-reveal (pre-existing shell timing,
  now restyled) — could tighten the reveal choreography if desired.
- 4 scene types restyled but unused by current lessons (demo-cue, dig-deeper,
  preview-band, setup-checklist) — ready when a future lesson needs them.

## Notes
- Scene types NOT used by any of the 7 lessons (restyled for future only):
  demo-cue, dig-deeper, preview-band, setup-checklist.
- demo-cue is a dark scene; the charcoal chrome is low-contrast on it — fine since
  no current lesson uses it. Revisit if a dark scene ships.
