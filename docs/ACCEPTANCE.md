# Completion Contract & Acceptance — Design-QC v3 fix cycle (2026-06-26)

> Done is proven by artifacts (green checks + rendered v3 keyframes), not assertion.

## Completion Contract (all six)
1. **Files changed** — exact paths listed in `agent-ops/STATE.json` per task.
2. **Tests run** — `npm run check` (typecheck + lint + vitest incl. `test/parity.test.ts`) exit 0,
   with output captured. Parity is the brand gate: it fails on inline hex/px/weight/radius that
   belongs in tokens, so a green parity run is positive proof the brand contract still holds.
3. **Each acceptance criterion** MET/UNMET with evidence (the specific change or the green check).
4. **Visual proof** — for rendered lessons: `out/v3/<id>.mp4` exists + passes `gate:status`,
   `gate:motion`, `gate:media`, and a non-silent `volumedetect`; re-extracted keyframes under
   `artifacts/keyframes-review-v3/<id>/` showing the fixed frame. The render IS the artifact
   (Remotion frame-driven components only render in-player, so no Playwright equivalent applies).
5. **Remaining risks** — recorded in STATE.json + WRAP_UP.md.
6. **Independent Codex review** — adversarial pass attempted at spec + verify gates; on this
   Windows box codex is unstable (DLL-init 0xC0000142). On crash → `awaiting_codex_review`,
   proceed, never hang, never fail open.

## Acceptance criteria (the do-first list — each is MET when the change lands + check is green)
- AC1 (bug) **Honesty disclaimer** — a token-driven "Stylized simulation" chip renders, unprompted
  by lesson data, in ComparisonChats, ToolDemo, ScreenFlow, VoiceDemo. Proof: chip visible in the
  v3 keyframe of at least one lesson per component; chip uses accent/accentSoft/4px (not full-pill).
- AC2 (bug) **DemoCue on brand** — demo-cue scene bg is linen #EDE8E3, "LIVE DEMO" badge radius 4px,
  watermark intact. Proof: v3 keyframe of a demo-cue lesson (e.g. topic-3-lesson-1).
- AC3 (bug) **JourneyMap even rhythm** — fixed-height eyebrow + bottom-aligned titles so all stops
  share one baseline even when a label wraps; "you are here" pill radius 4px. Proof: v3
  keyframe of a journey-map lesson (topic-1-lesson-1).
- AC4 (bug) **FeatureGrid count-aware** — 2- and 3-item grids no longer orphan cells. Proof: v3
  keyframe of topic-1-lesson-2.
- AC5 (bug) **Typography/radius bar** — no weight-800 titles/wordmark, no full-pill 999 radii
  anywhere (LessonChrome wordmark→700, CapabilityTable/SetupChecklist pills→4px, PreviewBand
  eyebrow→600/14, DigDeeper Context→600, ToolCardReveal monogram→700). Proof: parity green + spot
  keyframes.
- AC6 (bug) **No caption-chip / watermark collisions** — ProgressionCurve marker, AssignmentList,
  AuditQuadrant, ComparisonChats subcaption all clear the bottom caption band (≥30px) and watermark.
  Proof: v3 keyframe of a progression-curve lesson + a dense assignment lesson.
- AC7 (bug) **SetupChecklist cursor** lands on the toggle (coordinate frame fixed), entrances eased.
- AC8 (bug) **Per-lesson content** — an empty dig-deeper now has real free-tier content (not the
  fallback); a quote punctuation artifact is gone.
- AC9 **No regressions** — palette, Syne font, lesson scope, and all currently-PASS frames unchanged;
  flagged NON-bugs (14px composer radius, 0.12em in-card eyebrow) NOT altered.

## Out of scope this cycle (deferred / queued)
- Re-rendering every lesson (render math: many hours serial). v3 = prioritized flagship subset within
  the window; remainder queued in STATE.json.
- Large per-lesson rebuilds (a full scene redraw; new example beats).
