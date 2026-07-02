# PLAN — Design-QC v3 fix cycle (2026-06-26)

Source of truth for fixes: `artifacts/keyframes-review/00-DESIGN-QC-REPORT.md` (full findings)
+ `agent-ops/qc-fix-queue.json` (machine-readable: 32 shared-component bugs, 36 shared
revamps, 46 per-lesson bugs, 36 per-lesson revamps). This plan is the execution contract;
acceptance is `docs/ACCEPTANCE.md`.

## Goal
Land the high-leverage, surgical fixes the QC review found — mostly SHARED-COMPONENT bugs
(fix once → clears many lessons) — keep `npm run check` green (typecheck + lint + vitest
incl. brand `parity.test.ts`), then render a prioritized **version-3** subset to `out/v3/`
(never overwriting `out/*.mp4`) and publish to Drive alongside current for comparison.

## Three systemic themes (the synthesis headline)
1. **Honesty contract** — `ToolDemo`, `ComparisonChats`, `ScreenFlow`, `VoiceDemo` ship no
   "Stylized simulation" disclaimer. Fix: one shared `SimDisclaimer` chip, consumed by all four.
2. **DemoCue brand violation** — dark non-linen bg + full-pill "LIVE DEMO" badge + broken
   watermark recur in 7+ demo-cue lessons. Fix: re-skin `DemoCue` to linen, badge 999→4px,
   restore watermark.
3. **No reserved-height slots** — `JourneyMap`, `RecapGrid`, `FeatureGrid` let wrapped labels
   / uneven cards / orphaned grid cells drift. Fix: fixed-height slots + count-aware grid.

## Execution waves (file-disjoint so wave 1 runs in parallel safely)
**Wave 0 — foundation (1 builder, runs first):**
- `src/brand/shared.tsx`: add canonical `SimDisclaimer` chip (Syne 600, ~12px, accent on
  accentSoft, `BRAND.radius` 4px, low charcoal shadow, `data-decor`) — the one honesty label.
- `src/brand/tokens.ts`: add `SHADOW.button` (charcoal low-opacity, for VoiceDemo MicButton),
  `limitedCellBg` color token (CapabilityTable). No palette/font changes.
- `content/schemas/scene-types.ts`: additive, backward-compatible optional fields only —
  ComparisonChats `disclaimer?`, ScreenFlow step `label?`, ToolDemo outputs `lines?`,
  SetupChecklist `items.max(5)`. Verify `npx tsc --noEmit` clean before returning.

**Wave 1 — component packets (parallel, disjoint files), each reads the queue+report for its component:**
- ComparisonChats.tsx · ToolDemo.tsx · ScreenFlow.tsx · VoiceDemo.tsx (consume `SimDisclaimer`)
- DemoCue.tsx (linen re-skin)
- JourneyMap.tsx (fixed eyebrow/title slot, pill radius 2→4, eyebrow 600/14/.14, reserved pill row)
- FeatureGrid.tsx (count-aware 1/2/3/4 columns, center 2-item, LEADING.heading)
- Typo/radius A: LessonChrome.tsx + LessonCaptions.tsx, CapabilityTable.tsx, PreviewBand.tsx, DigDeeper.tsx
- Typo/radius B1: ToolCardReveal.tsx + ToolMark.tsx, SetupChecklist.tsx, AssignmentList.tsx
- Typo/radius B2: AuditQuadrant.tsx, ProgressionCurve.tsx, QuoteCard.tsx, RecapGrid.tsx, Cover.tsx
- Per-lesson content: `content/lessons/*/lesson.json` clear content bugs (an empty dig-deeper,
  a punctuation artifact, a duplicated eyebrow, a card.n off-by-one). Big rebuilds (scene-06 pipeline) are revamp scope, deferred.

## Hard rules for every builder (project contract)
- **Change the token, not the renderer.** No inline hex/px/weight/radius that belongs in tokens.
- **Match computed values; don't re-derive a "tasteful" interpretation.** Port the literal spec.
- **700 max on titles (never 800), eyebrows 600/.14em/14px crimson, 4px radius, no full-pill 999,
  flat-on-linen (low charcoal shadow, never glow), linen #EDE8E3 scene bg only.**
- **Easing for entrances (outCubic interpolate, lands on a known frame), springs only for genuine pops.**
- **Fonts fail loud** — never silent-fallback.
- **Do NOT "fix" the report's flagged NON-bugs:** ComparisonChats composer radius = `BRAND.radiusWindow`
  14px (contract-allowed); in-card eyebrow 0.12em is the system convention; FeatureGrid card
  `fontSize:34` is fixed (per-lesson wrap perception); the RecapGrid card.n off-by-one is lesson data.
- **Minimal diffs.** Edit only the files in your packet. tokens.ts/shared.tsx/scene-types.ts are
  read-only in wave 1 (foundation already added what's needed).

## After fixes
`npm run check` green → v3 render queue (RENDER_OUT_DIR=out/v3, RENDER_CONCURRENCY=4, serial,
keyed to batch.done) → gate:status/motion/media + volumedetect AFTER each → publish v3 to Drive.
Renders own the machine; never run gates/tests during a live render.

## Codex
Attempt adversarial review at spec + verify gates, fail-fast (codex unstable on this Windows box,
DLL-init 0xC0000142 as of 2026-06-22). On crash: mark `awaiting_codex_review`, proceed, never hang.
