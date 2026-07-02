---
type: concept
title: "Video output map (out/* vs output/video/*)"
tags: [video, renders, output-dirs, compositions, audit]
sources: []
created: 2026-06-26
updated: 2026-07-02
---

# Video output map

The repo has **two distinct rendered-video trees** plus several render-version subdirs. An audit (or a "is the X video done?" check) that scans only one tree will wrongly report a video missing — this happened **3× with the platform walkthrough**, which lives in `output/video/` (NOT `out/`) while everything else looked there. **When auditing videos, search BOTH `out/**` and `output/video/**`.**

## The two trees

### `out/` — lessons + sizzle (the main pipeline output)
Default `RENDER_OUT_DIR` for the codified lesson pipeline. Holds:
- **Lessons:** `topic-N-lesson-M.mp4`.
- **Sizzle reels:** `sizzle-16x9.mp4`, `sizzle-9x16.mp4` (+ legacy `sizzle-1.mp4`).
- **Legacy/early-slice:** `module-1.mp4`, `module-1-silent.mp4`, plus QC PNGs (`check-*.png`, `smoke-caption.png`) and helper subdirs (`qc/`, `slice/`, `lesson-stills/`, `verify/`, `_colortest/`).
- **Render-version subdirs (never overwrite `out/*`):**
  - **`out/v2/`** — the v2 facelift pass: a subset of lessons + `sizzle-16x9/9x16.mp4`.
  - **`out/v3/`** — the design-QC re-render pass. Rendered 2026-06-26 → 2026-06-30 (resumable per-lesson queue) and published to Drive alongside the originals. **Caveat:** one lesson was a later full-SCALE=2 re-render whose Drive publish was pending because the Drive mount was offline; confirm it landed before relying on Drive as the source of truth for that lesson. The pre-UAT audit continues on branch `fable-e2e-audit`, ledger `agent-ops/STATE.json`.

### `output/video/` — platform walkthrough + brand showcase (a SEPARATE composition tree)
A different output dir AND different Remotion compositions than the lessons. Two files:
- **`platform-walkthrough.mp4`** — 60s. Composition `PlatformWalkthrough` (`durationInFrames=1800` @ 30fps) in `src/compositions/PlatformWalkthrough.tsx`, registered in `src/Root.tsx` as id `"PlatformWalkthrough"`. Dated May 15.
- **`brand-showcase.mp4`** — composition `BrandShowcase` (`durationInFrames=300` = 10s) in `src/compositions/BrandShowcase.tsx`, registered as id `"BrandShowcase"`. Dated May 13.

**Standard-compliance:** both are pre-v2/v3 and **NOT up to standard** — `color_space=bt470bg` (not the BT.709 the liveliness/media gate requires) and a white background on the walkthrough. Both need a **BT.709 re-render** before they'd pass `gate:media`. This is a known follow-up, not a missing asset.

**Status as of 2026-07-02: `platform-walkthrough.mp4` refresh is an active in-progress task** on branch `fable-e2e-audit` (task `BUILD-walkthrough-v3` in `agent-ops/STATE.json`) — bring `PlatformWalkthrough.tsx` up to the current v3 design system + BT.709, re-render, gate, publish. **Its path is `output/video/platform-walkthrough.mp4`, not `out/`** — recorded here explicitly because this exact miss ("video is missing") has already happened 3 times (see `learnings.md`). Check this page (or the STATE.json task) for the refreshed file before assuming it doesn't exist.

Sibling artifacts under `output/` are unrelated to these MP4s: `output/verification/` (Playwright screenshots) and `output/validation/report.json`.

## Don't confuse with the *planned* walkthrough
A planning package for a platform-walkthrough sizzle (a designed `scene-contract.json` + `LESSON-PLAN.md` + `storyboard.md`) is a **planning artifact**, not the rendered MP4 in `output/video/`. The rendered walkthrough predates that contract.

## Delivery (where gate-green videos go, NOT git)
Finalized lesson MP4s are **not** committed (too big). They are published to the shared Google Drive `Content Development/Curriculum` tree via `npm run publish:drive -- <lessonId>` (gate-gated; Drive root is a per-machine env var `DRIVE_CURRICULUM_DIR` / `drive.local.json`). Structure: `00 — START HERE/` (course overview + promo sizzle) · `Module N — <title>/Lesson N.M — <title>/` with exactly three artifacts per lesson (`N.M Video.mp4`, `N.M Script.pdf`, `N.M Lesson Plan.pdf`). v3 re-renders are published **alongside** the originals with a v3 marker, never overwriting.

## Where this fits
- [[codified-lesson-pipeline]] — the DAG that produces the `out/` lesson MP4s.
