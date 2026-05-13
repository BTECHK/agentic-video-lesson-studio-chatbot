# Phase 1: Rendering Environment & Verification - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

A containerized Remotion rendering pipeline that produces verified MP4 output with human-reviewable screenshots at every stage. This phase delivers the infrastructure — Docker environment, dev preview, render pipeline, verification workflow, and post-render validation. No animation content beyond a brand showcase test composition.

</domain>

<decisions>
## Implementation Decisions

### Development Environment
- **D-01:** Project source code lives on the WSL2 filesystem (e.g., `~/projects/agentic-video-lesson-studio-chatbot/`). WSL2 is already installed and configured. Docker Desktop uses the WSL2 backend.
- **D-02:** Remotion Studio (`npx remotion studio`) is the primary development preview tool. Runs in the browser at localhost:3000 with hot reload, timeline scrubbing, and per-composition selection.
- **D-03:** Docker Compose has two services: `dev` (Remotion Studio with port 3000 forwarded, source bind-mounted) and `render` (headless Chrome + FFmpeg for final MP4 output with output volume).

### Verification Workflow
- **D-04:** Rendered scene screenshots are presented in an auto-generated HTML gallery (`output/verification/index.html`). Each scene shows its screenshots in order with scene names. Supports future side-by-side storyboard comparison (VERI-03).
- **D-05:** Screenshots captured at three key frames per scene: start (frame 0), midpoint (frame N/2), and end (frame N). Balances coverage with reviewability.
- **D-06:** Post-render validation runs automatically before human review and checks all four areas: file size & resolution (MP4 < 1.8GB, 1920x1080, 30fps), blank frame detection, font rendering verification (Syne not falling back), and duration accuracy vs storyboard.

### Test Composition
- **D-07:** The test composition is a "Brand Showcase" (~5-10 seconds, 3 mini-scenes): Scene 1 — Typography (Syne at 400/600/800 weights), Scene 2 — Brand Elements (#EDE8E3 background, 4px radius cards, #8B2635 accent), Scene 3 — Motion Test (spring-physics animation). This validates font loading, color accuracy, and motion rendering — directly feeds Phase 2 confidence.
- **D-08:** Syne font is bundled in the Docker image at build time (downloaded from Google Fonts, installed to `/usr/share/fonts/syne/`). No network dependency at render time.

### Deterministic Rendering
- **D-09:** Deterministic rendering uses frame-level visual comparison, not byte-identical MP4 (encoding metadata like timestamps and encoder versions can differ between runs even with identical frames).
- **D-10:** Pixel comparison tolerance of 0.1% difference per frame — accounts for subpixel antialiasing without masking real regressions.
- **D-11:** Reference snapshots stored in `test/fixtures/` in Git. CI compares rendered output against these known-good screenshots.
- **D-12:** Determinism enforced by: fixed random seeds, bundled fonts (D-08), pinned Docker image versions, and no network calls during render.

### Claude's Discretion
- Font loading strategy (D-08), deterministic rendering approach (D-09 through D-12) — user deferred these technical decisions to Claude's best-practice recommendations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand & Animation Style
- `original background content/animation research/animation-research.md` — UI/UX design contract, animation design contract, and motion principles derived from Anthropic Cowork video analysis. Defines the "warm minimalist" aesthetic, tether method, sequential staging, and micro-interactions.

### Project Context
- `.planning/REQUIREMENTS.md` — INFRA-01 through INFRA-06 and VERI-01 through VERI-04 define this phase's requirements
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 items) and dependency structure

### Existing Assets
- `original background content/Module 1 Slides.html` — Module 1 HTML mockup establishing design direction (reference for Phase 2, but useful for understanding brand application)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project. All components built from scratch.

### Established Patterns
- No established patterns yet. Phase 1 sets the foundational patterns for the project.

### Integration Points
- Docker Compose is the entry point for all subsequent phases. Phase 2 builds animations on top of this rendering pipeline.
- The verification HTML gallery and post-render validation established here will be used by every future phase that produces video output.

</code_context>

<specifics>
## Specific Ideas

- Animation vision is specifically modeled on the Anthropic Cowork video (see animation-research.md) — "warm minimalist" aesthetic with fluid physics
- Brand showcase test composition deliberately exercises the exact brand tokens that Phase 2 will use at scale — this is a risk-reduction strategy, not just a smoke test
- The HTML verification gallery should be extensible to support VERI-03 (side-by-side storyboard vs actual) in Phase 2

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-Rendering Environment & Verification*
*Context gathered: 2026-05-13*
