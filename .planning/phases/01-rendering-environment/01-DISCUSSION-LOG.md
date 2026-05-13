# Phase 1: Rendering Environment & Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 1-Rendering Environment & Verification
**Areas discussed:** Dev environment setup, Verification workflow, Test composition scope, Deterministic rendering

---

## Dev Environment Setup

### Filesystem Location

| Option | Description | Selected |
|--------|-------------|----------|
| WSL2 filesystem | Move project to ~/projects/ inside WSL2. Native Docker bind-mount speed. | ✓ |
| Stay on Windows filesystem | Keep on the Windows drive. Docker I/O penalty (2-5x slower). | |
| Hybrid approach | Source on Windows, Docker volumes for node_modules and output. | |

**User's choice:** WSL2 filesystem
**Notes:** None

### Dev Preview Method

| Option | Description | Selected |
|--------|-------------|----------|
| Remotion Studio | Built-in dev server with hot reload, timeline controls, frame stepping. | ✓ |
| Render-and-check | No live preview, render to MP4 then watch. | |
| Both modes | Studio for dev + separate render command for final output. | |

**User's choice:** Remotion Studio
**Notes:** None

### Docker Compose Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two services | Dev (Remotion Studio) + Render (headless Chrome + FFmpeg). | ✓ |
| Single service | One container, different commands. | |
| Three services | Dev + Render + Validation as separate steps. | |

**User's choice:** Two services
**Notes:** None

### WSL2 Status

| Option | Description | Selected |
|--------|-------------|----------|
| WSL2 is ready | Ubuntu installed, Docker configured for WSL2 backend. | ✓ |
| Need to set it up | WSL2 not installed, include setup steps. | |
| You decide | Claude handles — include setup if needed. | |

**User's choice:** WSL2 is ready
**Notes:** None

---

## Verification Workflow

### Review UX

| Option | Description | Selected |
|--------|-------------|----------|
| HTML gallery | Auto-generated HTML page with scene screenshots in order. | ✓ |
| Folder of PNGs | Screenshots dumped to output/screenshots/. | |
| CLI summary | Terminal pass/fail output with file paths. | |

**User's choice:** HTML gallery
**Notes:** None

### Capture Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Key frames | Start, midpoint, end — 3 per scene. | ✓ |
| Start and end only | Two per scene. | |
| Every N frames | Every 30th frame (1/sec at 30fps). | |

**User's choice:** Key frames
**Notes:** None

### Post-Render Validation Checks

| Option | Description | Selected |
|--------|-------------|----------|
| File size & resolution | MP4 < 1.8GB, 1920x1080, 30fps. | ✓ |
| Blank frame detection | Scan for black/white/transparent frames. | ✓ |
| Font rendering check | Verify Syne loaded, not fallback. | ✓ |
| Duration accuracy | Video duration matches storyboard. | ✓ |

**User's choice:** All four (multi-select)
**Notes:** None

---

## Test Composition Scope

### Test Content

| Option | Description | Selected |
|--------|-------------|----------|
| Brand showcase | 3 mini-scenes: typography, brand elements, motion test (~5-10s). | ✓ |
| Minimal pipeline proof | Colored rectangle moves across screen. Fastest to build. | |
| Module 1 teaser | Single slide from Module 1 mockup with brand styling. | |

**User's choice:** Brand showcase
**Notes:** None

### Font Loading (Claude's discretion)

| Option | Description | Selected |
|--------|-------------|----------|
| Bundled in image | Download at build time, no network dependency. | ✓ |
| Google Fonts CDN | Runtime @import — requires network. | |

**User's choice:** Deferred to Claude — bundled in image selected
**Notes:** User said "I don't really know anything about this so let's just go through recommendations for the rest."

---

## Deterministic Rendering

All decisions in this area were deferred to Claude's recommendations.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Comparison method | Frame-level pixel comparison | Byte-identical MP4 is impractical due to encoding metadata variance |
| Tolerance | 0.1% pixel difference | Accounts for subpixel antialiasing without masking regressions |
| Reference storage | test/fixtures/ in Git | CI can compare against known-good snapshots |
| Enforcement | Fixed seeds, bundled fonts, pinned images, no network | Standard deterministic rendering practices |

**Notes:** User deferred entire area to Claude's best-practice recommendations.

---

## Claude's Discretion

- Font loading strategy — bundled in Docker image (D-08)
- Deterministic rendering approach — frame-level comparison, 0.1% tolerance, reference snapshots in Git (D-09 through D-12)

## Deferred Ideas

None — discussion stayed within phase scope
