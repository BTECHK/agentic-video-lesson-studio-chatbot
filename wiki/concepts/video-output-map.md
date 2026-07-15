---
type: concept
title: "Video output map (out/* vs output/video/*)"
tags: [video, renders, output-dirs, compositions, audit]
sources: []
created: 2026-06-26
updated: 2026-07-09
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
  - **`out/v3/`** — the design-QC re-render pass. The MP4s were rendered from a resumable per-lesson queue and published to Drive. **CORRECTION 2026-07-09 (hail-mary ship phase):** the earlier "all gate-green" claim was NOT verifiable and is now known false. A fresh `gate:status` sweep found that many lessons have no review bundle at all (no `review/*.md`, so `gate:status` cannot pass and the lesson is unpublishable). The "gate-green" lessons had **stale** `layout-gate.md` files from before the SceneAmbient/clip conflict; a fresh `gate:layout` FAILs them until the `data-decor` fix (see [[layout-integrity-gate]]). So `out/v3` has all its MP4s but only some lessons are actually gateable, and the corpus is NOT fully QC'd. (This was the stakeholder persona's "gate-checked is unverifiable" flag, now confirmed.)
  - **Hail-mary v4 re-renders (2026-07-09):** a few lessons were re-rendered to `out/v3` with the v4 motion system (`motionProfile` seam, scene-exit glides, QuoteCard word-synced reveal; cover variants held back). Only one is published so far; the full ship is blocked on the missing review bundles plus a long corpus re-render. Resume state: `agent-ops/RESUME-hail-mary-ship.md`.

### `output/video/` — platform walkthrough + brand showcase (a SEPARATE composition tree)
A different output dir AND different Remotion compositions than the lessons. Two files:
- **`platform-walkthrough.mp4`** — 60s. Composition `PlatformWalkthrough` (`durationInFrames=1800` @ 30fps) in `src/compositions/PlatformWalkthrough.tsx`, registered in `src/Root.tsx` as id `"PlatformWalkthrough"`. Dated May 15.
- **`brand-showcase.mp4`** — composition `BrandShowcase` (`durationInFrames=300` = 10s) in `src/compositions/BrandShowcase.tsx`, registered as id `"BrandShowcase"`. Dated May 13.

**Status as of 2026-07-04: `platform-walkthrough.mp4` is DONE and up to standard** — refreshed during the fable-e2e-audit mission (SceneAmbient motion in all 4 scenes + the outro, audible music bed, BT.709 via `npm run render:walkthrough`), **passes `gate:motion` AND `gate:media`**, and is published to Drive as `00 — START HERE/Sample Academy — Platform Walkthrough v3.mp4`. **Its path is `output/video/platform-walkthrough.mp4`, not `out/`** — recorded here explicitly because "video is missing" has already happened 3 times (see `learnings.md`).

`brand-showcase.mp4` remains pre-v2 (bt470bg, silent) — an internal artifact, not a course deliverable; flagged report-only in the audit.

**2026-07-04 re-render wave:** a batch of `out/v3` lessons was re-rendered with the audit fixes (systemic bottom-band layout collisions, DemoCue ambient-motion fix, narration corrections) — all gate-green and re-published to Drive as `… v3.mp4`. **Note: `out/sizzle-16x9.mp4` / `out/sizzle-9x16.mp4` are STALE intermediates that fail gates — the shipped sizzle is the Drive "Sizzle Reel v2" pair, which passes everything.** Audit report: `artifacts/verification/fable-e2e-audit/AUDIT-REPORT.md`.

Sibling artifacts under `output/` are unrelated to these MP4s: `output/verification/` (Playwright screenshots) and `output/validation/report.json`.

## Don't confuse with the *planned* walkthrough
A planning package for a platform-walkthrough sizzle (a designed `scene-contract.json` + `LESSON-PLAN.md` + `storyboard.md`) is a **planning artifact**, not the rendered MP4 in `output/video/`. The rendered walkthrough predates that contract.

## Delivery (where gate-green videos go, NOT git)
Finalized lesson MP4s are **not** committed (too big). They are published to the shared Google Drive `Content Development/Curriculum` tree via `npm run publish:drive -- <lessonId>` (gate-gated; Drive root is a per-machine env var `DRIVE_CURRICULUM_DIR` / `drive.local.json`). Structure: `00 — START HERE/` (course overview + promo sizzle) · `Module N — <title>/Lesson N.M — <title>/` with exactly three artifacts per lesson (`N.M Video.mp4`, `N.M Script.pdf`, `N.M Lesson Plan.pdf`). v3 re-renders are published **alongside** the originals with a v3 marker, never overwriting.

## Where this fits
- [[codified-lesson-pipeline]] — the DAG that produces the `out/` lesson MP4s.
