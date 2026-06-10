---
type: concept
title: "Layout Integrity Gate (Gate L)"
tags: [gates, rendering, typography, quality]
created: 2026-06-09
updated: 2026-06-09
sources: []
---

# Layout Integrity Gate (Gate L)

The fourth lesson gate (#73), added after Gate C waved through a video with real typography defects on 2026-06-08 (an unclosed quote glyph overflowing into the eyebrow; colliding title lines at `lineHeight: 1.04`). Content/brand/audio checks all passed — **geometry has to be measured, not assumed**.

## How it works

Remotion renders real DOM in headless Chrome, so the gate measures it directly. `LayoutProbe` (mounted only when the `layoutProbe` input prop is set) walks the document at one settled frame per scene and emits each visible element's `getBoundingClientRect` over the browser console. The pure analyzer (`src/lib/gate-layout.ts`) then asserts three rules:

- **clip** — no element's content overflows a box that cuts it off
- **safe-area** — no text leaf crosses the `SAFE_AREA` inset (`src/brand/tokens.ts`, 96×54 of 1920×1080)
- **overlap** — no two unrelated text leaves materially intersect (decorative `data-decor` elements exempt; ancestor/descendant pairs ignored)

Artifact: `content/lessons/<id>/review/layout-gate.md` (`Verdict: PASS|FIX`), evidence stills in `out/verify/layout/`. Run: `npm run gate:layout -- <id>`.

## Why it's systematic, not a patch

The companion fix (#72) moved typography off per-component hardcoded values onto shared scales in `src/brand/tokens.ts` — `LEADING` (display floor 1.12), a 4px `SPACE` scale, and `SAFE_AREA` — consumed by every scene primitive in `shared.tsx`. So the defect class is fixed at the design-system level **and** machine-caught on every future render. The Definition of Done is now **A·B·C·L** (see [[architecture-decisions]]).

Related: [[codified-lesson-pipeline]]
