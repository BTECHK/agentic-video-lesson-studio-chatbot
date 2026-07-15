---
type: concept
title: "Layout Integrity Gate (Gate L)"
tags: [gates, rendering, typography, quality]
created: 2026-06-09
updated: 2026-07-09
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

## The clip rule flags ANY overflowing `overflow:hidden` box — decorative layers MUST be `data-decor` (2026-07-09)

`analyzeFrame` (`src/lib/gate-layout.ts`) pushes a `clip` violation for **every** non-`data-decor` element the probe marks `clipped` (`overflow` in hidden/clip/auto/scroll AND `scrollWidth/Height > client`). This bit the whole corpus: `SceneAmbient` (`shared.tsx`) is a full-frame `overflow:hidden` box whose `inset:-200` glow layers overflow it by ~200px, so it trips the clip rule on **every scene of every lesson**. Fix: mark decorative-overflow elements `data-decor` (the gate exempts them — "watermarks may bleed"); this is a probe-only attribute with **zero pixel change**, so no re-render is needed for the fix itself. Rule of thumb: any deliberately-bleeding `overflow:hidden` layer (ambient glow, watermark, accent bar) needs `data-decor` from day one, or a fresh Gate L will fail it.

## STALE-ARTIFACT TRAP: `gate:status` green ≠ the current render passes Gate L (2026-07-09)

`gate:status` only **reads** the cached `review/layout-gate.md`; it never re-measures. So a code change that affects the rendered DOM (a new v4 motion path, a SceneAmbient tweak, a component refactor) **silently invalidates** every lesson's Gate-L artifact while `gate:status` keeps reporting the stale PASS. Discovered the hard way: every lesson with a cached artifact showed `PUBLISH OK` on `layout-gate.md` files written before the SceneAmbient/clip conflict existed; a **fresh** `gate:layout` FAIL-ed all of them (and the v4 re-renders — which also surfaced a real Cover-variant overflow). **Rule: after ANY render-affecting change, re-run `gate:layout` (and re-render) before trusting `gate:status` — treat a cached PASS whose code has changed as UNKNOWN, not green.** This is the layout-gate face of the broader "audio/gate freshness" class already logged for `align`/`tts` in `learnings.md`.

Related: [[codified-lesson-pipeline]] · [[video-output-map]]
