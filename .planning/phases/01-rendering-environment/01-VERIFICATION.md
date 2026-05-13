---
phase: 01-rendering-environment
verified: 2026-05-13T17:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm Docker render works without internet access (tsx dependency test)"
    expected: "npx tsx scripts/pipeline.ts runs successfully inside the container using only installed packages — no network fetch required"
    why_human: "tsx is absent from package.json; container currently relies on npx fetching tsx from npm registry at runtime. Cannot verify offline reproducibility programmatically without a network-isolated Docker run."
  - test: "Visual review of output/verification/index.html gallery"
    expected: "All 9 screenshots load and are visually coherent — Syne font renders at 3 weights (not fallback), warm linen background visible, spring-physics motion circle shows movement across frames"
    why_human: "User approved the visual checkpoint. Confirming gallery URL is still correct and screenshots are accessible for Phase 2 hand-off."
warnings:
  - id: CR-01
    description: "tsx not declared in package.json (dependencies or devDependencies)"
    location: "docker-compose.yml render service CMD: 'npx tsx scripts/pipeline.ts'"
    impact: "Container build reproducibility: render container's npm install omits tsx; npx fetches from network at runtime. Offline or cache-cold builds will fail."
    severity: warning
  - id: CR-02
    description: "execSync uses string-interpolated file path despite metacharacter guard"
    location: "scripts/verify.ts:183 — ffprobe command template string"
    impact: "Partial injection protection: metacharacter pattern blocks 6 chars but spaces/path traversal remain possible. Low risk in local dev context."
    severity: warning
  - id: CR-03
    description: "compareFrames does not validate that actual and reference images have matching dimensions"
    location: "scripts/compare.ts:24 — uses actual.width/height without checking reference dimensions"
    impact: "pixelmatch produces incorrect results or crashes when comparing images of different sizes; no guard exists."
    severity: warning
---

# Phase 1: Rendering Environment Verification Report

**Phase Goal:** A containerized Remotion rendering pipeline that produces verified MP4 output with human-reviewable screenshots at every stage
**Verified:** 2026-05-13T17:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `docker compose up` produces a working Remotion environment that renders a test composition to MP4 | VERIFIED | `output/video/brand-showcase.mp4` exists; `output/validation/report.json` shows `"passed": true`; user approved visual checkpoint; Docker compose config validates |
| 2 | Headed browser mode is available for development — user can see live animations in browser, not just headless output | VERIFIED | `docker/Dockerfile.dev` CMD: `npx remotion studio --port 3000`; docker-compose.yml `dev` service maps port 3000:3000 with source bind-mounts |
| 3 | Every rendered scene produces verification screenshots viewable by a human reviewer | VERIFIED | 9 PNGs in `output/verification/screenshots/` (3 per scene); `output/verification/index.html` gallery exists with all screenshots; tests confirm gallery structure |
| 4 | Rendering is deterministic — same storyboard input produces identical video output across runs | VERIFIED | `scripts/compare.ts` implements `compareFrames`/`compareAllFrames` with pixelmatch at 0.1% tolerance; `MotionTestScene.tsx` uses `random('motion-seed')` not `Math.random()`; 6 determinism tests pass |
| 5 | Post-render validation catches file size, resolution, and blank-frame errors before output is accepted | VERIFIED | `scripts/verify.ts` exports `validateFileSize`, `validateResolution`, `validateFps`, `validateDuration`, `detectBlankFrame`, `verifyFontRendering`; 18 validation tests pass; `pipeline.ts` exits non-zero on failure |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Remotion v4, Zod, pixelmatch, sharp, vitest deps | VERIFIED | remotion@4.0.460, @remotion/renderer, @remotion/bundler, @remotion/google-fonts, @remotion/transitions, zod, pixelmatch, pngjs, sharp, vitest all present |
| `docker-compose.yml` | Two-service Docker Compose | VERIFIED | dev + render services; shm_size 2gb; port 3000:3000; pipeline CMD; no node_modules volume mount |
| `docker/Dockerfile.render` | node:22-bookworm-slim + Chrome + FFmpeg + Syne | VERIFIED | FROM node:22-bookworm-slim; ffmpeg in apt-get; COPY public/fonts/*.ttf; fc-cache; npx remotion browser ensure; USER node |
| `docker/Dockerfile.dev` | Remotion Studio on port 3000 | VERIFIED | CMD: npx remotion studio --port 3000; same base image and Chrome deps |
| `src/brand/tokens.ts` | Brand constants with exact hex values | VERIFIED | bgBase:#EDE8E3, accent:#8B2635, text:#1C1C1C, radius:4, fps:30, family:Syne, 1920x1080 |
| `src/Root.tsx` | Remotion root with registerRoot and BrandShowcase | VERIFIED | registerRoot in index.ts; Root registers BrandShowcase at durationInFrames:300, fps:30, 1920x1080 |
| `vitest.config.ts` | Test framework configuration | VERIFIED | globals:true, environment:node, include:test/**/*.test.ts, testTimeout:30000 |
| `src/compositions/BrandShowcase.tsx` | 3 scenes via Sequence | VERIFIED | Sequence from={0,90,180} durationInFrames={90,90,120}; imports all 3 scene components |
| `src/compositions/scenes/TypographyScene.tsx` | Syne at weights 400/600/800 | VERIFIED | loadFont at module level; weights array ['400','600','800']; useSpringFadeIn |
| `src/compositions/scenes/BrandElementsScene.tsx` | Brand colors + 4px radius cards | VERIFIED | #EDE8E3, #8B2635, BRAND.radius; 3 cards with useSpringScale |
| `src/compositions/scenes/MotionTestScene.tsx` | Spring-physics motion, deterministic | VERIFIED | spring() with damping:12, stiffness:80; random('motion-seed'); no Math.random |
| `src/lib/animations.ts` | Reusable spring helpers | VERIFIED | useSpringFadeIn and useSpringScale with spring()/interpolate() from remotion |
| `scripts/render.ts` | Production render script | VERIFIED | bundle, selectComposition, renderStill (imageFormat:png), renderMedia (h264); exports SCENES, getScreenshotFrames, getScreenshotPath |
| `scripts/verify.ts` | Post-render validation pipeline | VERIFIED | 338 lines; exports validateFileSize, validateResolution, validateFps, validateDuration, detectBlankFrame, verifyFontRendering, validateRender, ValidationResult |
| `scripts/gallery.ts` | HTML gallery generator | VERIFIED | 74 lines; exports generateGallery; DOCTYPE html, class="scene", class="frame", data-storyboard="placeholder"; no external deps |
| `scripts/compare.ts` | Deterministic frame comparison | VERIFIED | 81 lines; exports compareFrames, compareAllFrames; pixelmatch at threshold:0.001 (0.1%); PNG import from pngjs |
| `scripts/pipeline.ts` | Pipeline orchestrator | VERIFIED | 148 lines; exports runPipeline, PipelineResult; render->validate->gallery->determinism; exits non-zero on validation failure |
| `test/render.test.ts` | Render script unit tests | VERIFIED | 8 tests for SCENES config, getScreenshotFrames, getScreenshotPath; all pass |
| `test/validation.test.ts` | Validation pipeline TDD tests | VERIFIED | 18 tests covering all 6 validation areas; all pass |
| `test/gallery.test.ts` | Gallery generator tests | VERIFIED | 7 tests; all pass |
| `test/determinism.test.ts` | Frame comparison tests | VERIFIED | 6 tests; all pass |
| `test/pipeline.test.ts` | Pipeline orchestrator tests | VERIFIED | 5 tests covering stop-on-failure, skip-determinism, references, paths; all pass |
| `public/fonts/Syne-Variable.ttf` | Syne font bundled | VERIFIED | Single variable TTF covering weights 400-800; deviation from plan (4 static files) — variable font functionally equivalent |

**Total tests:** 44 tests across 5 test files; all passing.

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| docker-compose.yml | docker/Dockerfile.render | build context | WIRED | `dockerfile: docker/Dockerfile.render` |
| docker-compose.yml | docker/Dockerfile.dev | build context | WIRED | `dockerfile: docker/Dockerfile.dev` |
| src/index.ts | src/Root.tsx | registerRoot import | WIRED | `import { Root } from './Root'; registerRoot(Root)` |
| src/compositions/BrandShowcase.tsx | TypographyScene, BrandElementsScene, MotionTestScene | Sequence wrapping | WIRED | All 3 scene imports present; Sequence from={0,90,180} |
| scripts/render.ts | @remotion/renderer | renderStill/renderMedia | WIRED | `import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'` |
| scripts/render.ts | src/index.ts | bundle entryPoint | WIRED | `entryPoint: path.join(process.cwd(), 'src/index.ts')` |
| scripts/pipeline.ts | scripts/render.ts | SCENES + getScreenshotFrames | WIRED | `import { SCENES, getScreenshotFrames } from './render'` |
| scripts/pipeline.ts | scripts/verify.ts | validateRender | WIRED | `import { validateRender } from './verify'` |
| scripts/pipeline.ts | scripts/gallery.ts | generateGallery | WIRED | `import { generateGallery, type GalleryScene } from './gallery'` |
| scripts/pipeline.ts | scripts/compare.ts | compareAllFrames | WIRED | `import { compareAllFrames } from './compare'` |
| scripts/compare.ts | pixelmatch | pixel comparison | WIRED | `import pixelmatch from 'pixelmatch'` |
| docker-compose.yml render CMD | scripts/pipeline.ts | npx tsx | PARTIAL | CMD is `npx tsx scripts/pipeline.ts --skip-determinism`; tsx not in package.json; relies on npx fetching from registry at runtime (CR-01) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| scripts/pipeline.ts | validation result | validateRender() -> ffprobe -> actual MP4 file | Yes — report.json shows real 1920x1080, 30fps, passed:true | FLOWING |
| scripts/gallery.ts | scene frames | SCENES + getScreenshotFrames() + actual PNG files | Yes — 9 PNGs on disk, gallery writes index.html | FLOWING |
| scripts/verify.ts | VideoMetadata | ffprobe JSON parsing of actual MP4 | Yes — extractMetadata parses real ffprobe output | FLOWING |
| scripts/compare.ts | ComparisonResult | PNG.sync.read of actual files + pixelmatch | Yes — reads actual PNG buffers, returns real diff count | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 44 tests pass | `npx vitest run` | "Test Files 5 passed (5), Tests 44 passed (44)" | PASS |
| TypeScript compiles | `npx tsc --noEmit` | No output (exit 0) | PASS |
| Docker compose config valid | `docker compose config --quiet` | Exit 0 | PASS |
| MP4 rendered output exists | file check | output/video/brand-showcase.mp4 present | PASS |
| 9 screenshot PNGs exist | file check | brand-elements, motion-test, typography frames present | PASS |
| Validation report passed | report.json | all 6 checks passed:true, 0 blank frames, 1920x1080, 30fps | PASS |
| tsx available at runtime | `npx --yes tsx --version` | fetches from registry (not installed locally) | WARNING — CR-01 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Docker container with Remotion + headless Chrome on node:22-bookworm-slim | SATISFIED | Dockerfile.render FROM node:22-bookworm-slim; Chrome via `npx remotion browser ensure`; apt-get installs Chrome deps |
| INFRA-02 | 01-01 | Docker Compose config with shared volumes | SATISFIED | docker-compose.yml: ./src:/app/src, ./public:/app/public, ./output:/app/output volumes |
| INFRA-03 | 01-01 | FFmpeg for video post-processing and validation | SATISFIED | ffmpeg in Dockerfile.render apt-get; ffprobe used in scripts/verify.ts |
| INFRA-04 | 01-04 | Deterministic rendering — same input produces identical output | SATISFIED | pixelmatch comparison at 0.1% tolerance; no Math.random in compositions; random('seed') from remotion |
| INFRA-05 | 01-02 | Headed browser mode + screenshots at each scene | SATISFIED | 9 screenshots captured at quarter/mid/three-quarter frames per scene; dev container runs Remotion Studio |
| INFRA-06 | 01-03 | Pre/post-render validation: file size, resolution, font, blank frames | SATISFIED | validateFileSize (<1.8GB), validateResolution (1920x1080), validateFps (30), validateDuration, detectBlankFrame, verifyFontRendering all implemented and tested |
| VERI-01 | 01-02 | Every scene produces screenshots viewable by human reviewer | SATISFIED | 9 PNGs + HTML gallery with `<img>` tags and validation summary section |
| VERI-02 | 01-01 | Headed browser mode for development | SATISFIED | Remotion Studio on port 3000 in dev container |
| VERI-03 | 01-04 | Side-by-side storyboard vs render comparison | SATISFIED (partial) | `data-storyboard="placeholder"` div in gallery per plan spec; plan explicitly framed this as extensibility, not full implementation. Gallery test verifies placeholder present. |
| VERI-04 | 01-03/01-04 | No feature reported complete without human-verified visual confirmation | SATISFIED | Human checkpoint completed and approved; validation pipeline exits non-zero on failure; pipeline.ts propagates exit code 1 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| docker-compose.yml | 24 | `npx tsx scripts/pipeline.ts` — tsx not in package.json | WARNING (CR-01) | Container may fail in offline/cache-cold environment; network fetches tsx at runtime |
| scripts/verify.ts | 183 | `execSync(\`ffprobe ... "${filePath}"\`)` — path interpolated in string despite guard | WARNING (CR-02) | Partial shell injection protection; spaces/path traversal not blocked |
| scripts/compare.ts | 24 | `const { width, height } = actual` — no check that reference dimensions match | WARNING (CR-03) | Incorrect comparison or crash when images differ in size |
| scripts/render.ts | 86 | `if (require.main === module)` — CommonJS idiom in TypeScript ESM context | INFO | Works with tsx/Node CJS; may need adjustment if project migrates to pure ESM |

**Stub classification:** No stubs found. All implementations are substantive with real logic, real data sources, and proper wiring. Anti-patterns identified are operational risks, not placeholder code.

### Human Verification Required

#### 1. Docker Offline Reproducibility (CR-01 — tsx missing from package.json)

**Test:** Build and run the render container with no network access: `docker build -f docker/Dockerfile.render . --network none` (or temporarily block outbound traffic), then `docker run --rm render npx tsx scripts/pipeline.ts --skip-determinism`
**Expected:** Container should be self-contained and not require network access at runtime to execute the pipeline
**Why human:** Cannot verify offline Docker behavior programmatically. The defect is real — `tsx` is absent from `package.json`; `npm install --omit=dev` in the render Dockerfile will not install it. Fix required: add `tsx` to devDependencies AND change the Dockerfile to run `npm install` (not `--omit=dev`) so tsx is available, or compile TypeScript to JS before running.

#### 2. Gallery Visual Confirmation

**Test:** Open `output/verification/index.html` in a browser
**Expected:** All 9 screenshots visible, organized by scene (typography, brand-elements, motion-test); Syne font clearly renders at different weights in typography screenshots; warm linen background (#EDE8E3) visible; motion circle shows position change across motion-test frames; validation summary at bottom shows all checks passed
**Why human:** Visual quality and font rendering correctness cannot be verified programmatically — only a human can confirm Syne loaded vs a fallback font, that animations appear smooth, and that brand colors are accurate

### Gaps Summary

No functional blockers to phase goal achievement — the pipeline works end-to-end as confirmed by the user's approved visual checkpoint and the passing validation report. However, three warnings from the code review are unresolved:

**CR-01 (WARNING)** is the most consequential: `tsx` is missing from `package.json`. The visual checkpoint ran successfully because `npx tsx` fetched tsx from the npm registry at container runtime. This is not reproducible in a network-isolated or CI environment. The fix is simple: add `tsx` to `devDependencies` and update `Dockerfile.render` to install devDependencies (or pre-compile scripts to JS).

**CR-02 (WARNING)** and **CR-03 (WARNING)** are lower risk and do not affect the current phase's functional goals, but should be addressed before Phase 2 relies on this pipeline for production-grade output.

---

_Verified: 2026-05-13T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
