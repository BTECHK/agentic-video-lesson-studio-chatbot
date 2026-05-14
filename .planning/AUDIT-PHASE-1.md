# Phase 1 Audit: Rendering Environment & Verification

**Audited:** 2026-05-14
**Auditor:** Claude Opus 4.6 (adversarial integrity audit)
**Method:** Line-by-line comparison of every plan claim against actual codebase
**Tests run:** `npx vitest run` -- 139 tests, all passing (8 test files)
**TypeScript:** `npx tsc --noEmit` -- clean, zero errors
**Docker compose:** `docker compose config` -- valid

---

## Plan 01-01: Scaffold Remotion Project + Docker Two-Service Architecture

### Claimed Features

| # | Feature | Status | Explanation |
|---|---------|--------|-------------|
| 1 | `package.json` with remotion, @remotion/renderer, @remotion/google-fonts, zod, pixelmatch, sharp, vitest | **PRESENT** | All listed. Also includes pngjs, @remotion/bundler, @remotion/cli, @remotion/transitions, @fontsource/syne, tsx, react, react-dom. |
| 2 | `tsconfig.json` configured | **PRESENT** | Targets ES2022, jsx: react-jsx, strict mode, bundler module resolution. |
| 3 | `remotion.config.ts` | **PRESENT** | Sets PNG image format and overwrite output. |
| 4 | `src/index.ts` with `registerRoot` | **PRESENT** | Exact match to plan. |
| 5 | `src/Root.tsx` registers BrandShowcase composition | **PRESENT** | Registers with id="BrandShowcase", durationInFrames=300, fps=BRAND.video.fps, width/height from BRAND.video. |
| 6 | `src/brand/tokens.ts` with exact hex values | **PRESENT** | bgBase: '#EDE8E3', text: '#1C1C1C', accent: '#8B2635', radius: 4, fps: 30, 1920x1080, Syne family, weight strings. Exact match to plan. |
| 7 | 4 Syne static font files (Regular, SemiBold, Bold, ExtraBold .ttf) | **PARTIAL** | Only `Syne-Variable.ttf` exists (1 file instead of 4). Variable font covers all weights, so functionally equivalent, but the plan explicitly specified 4 static files. This is a silent descope. |
| 8 | `docker/Dockerfile.render` with node:22-bookworm-slim, ffmpeg, Chrome, bundled Syne, non-root user | **PARTIAL** | Base image correct. FFmpeg installed. Chrome deps + `npx remotion browser ensure` present. Font bundled via `COPY public/fonts/*.ttf`. **Deviations:** (1) Plan said `USER remotion` with `useradd`, implementation uses `USER node` (built-in). Better practice but different from plan. (2) Plan said `npm ci`, implementation uses `npm install --omit=dev`. (3) Plan said render output should have `--output` flag, and the CMD uses the raw remotion render, but docker-compose overrides it. |
| 9 | `docker/Dockerfile.dev` with Remotion Studio on port 3000 | **PRESENT** | CMD: `npx remotion studio --port 3000`. Same base image, Chrome deps, font bundling, `USER node`. Uses `npm install` (not `npm ci` as planned). |
| 10 | `docker-compose.yml` with two services | **PRESENT** | `dev` (port 3000, source volumes) and `render` (output volume, shm_size 2gb). No node_modules mount (correct per plan). |
| 11 | `.dockerignore` | **PRESENT** | Excludes node_modules, output, .git, .planning, *.md, test/fixtures, plus additional media file patterns not in plan. |
| 12 | `vitest.config.ts` | **PRESENT** | globals: true, environment: node, include: test/**/*.test.ts, testTimeout: 30000. Exact match. |
| 13 | `src/compositions/.gitkeep` | **PRESENT** | Empty file exists. |

### Test Coverage

| Component | Status |
|-----------|--------|
| Brand tokens (values) | **UNTESTED** -- No unit test verifies token values. Compilation checks types but not runtime values. |
| Docker builds | **UNTESTED** -- No automated test. Plans said to manually verify Docker builds. |
| Vitest configuration | **TESTED** -- implicitly, since all tests run through it. |

### Connection Integrity

| Connection | Status | Explanation |
|------------|--------|-------------|
| `docker-compose.yml` -> `docker/Dockerfile.render` | **CONNECTED** | `dockerfile: docker/Dockerfile.render` |
| `docker-compose.yml` -> `docker/Dockerfile.dev` | **CONNECTED** | `dockerfile: docker/Dockerfile.dev` |
| `src/index.ts` -> `src/Root.tsx` | **CONNECTED** | `import { Root } from './Root'; registerRoot(Root);` |
| `src/Root.tsx` -> `src/brand/tokens.ts` | **CONNECTED** | `import { BRAND } from './brand/tokens'` |
| `src/Root.tsx` -> `src/compositions/BrandShowcase.tsx` | **CONNECTED** | `import { BrandShowcase } from './compositions/BrandShowcase'` |

### Orphans

| Item | Explanation |
|------|-------------|
| `@remotion/transitions` (package.json) | Installed dependency, never imported anywhere in src/. |
| `@fontsource/syne` (package.json) | Installed dependency, never imported anywhere. TypographyScene uses `@remotion/google-fonts/Syne` instead. |
| `src/lib/types.ts` (`SceneConfig` interface) | Exported but never imported by any file in the codebase. |

### Critical Issues

| # | Issue | Severity | Explanation |
|---|-------|----------|-------------|
| **B-01** | **Render container will fail at runtime: `tsx` is a devDependency but `Dockerfile.render` uses `npm install --omit=dev`** | **BLOCKER** | The docker-compose.yml render service command is `npx tsx scripts/pipeline.ts --skip-determinism`. But `tsx` is in `devDependencies` and `Dockerfile.render` runs `npm install --omit=dev`. This means `tsx` will NOT be installed in the container. The `npx` command will attempt to fetch `tsx` from the npm registry at runtime, which (a) requires network access, (b) is non-deterministic, and (c) will fail in offline/CI environments. This was noted in the verification report but NOT fixed. |
| **B-02** | **Plan specified `npm ci` for Docker builds, implementation uses `npm install`** | **WARNING** | `npm ci` uses the lockfile exactly and is the standard for Docker builds. `npm install` may resolve different versions. Less severe but affects reproducibility. |

---

## Plan 01-02: Brand Showcase Composition + Render Script

### Claimed Features

| # | Feature | Status | Explanation |
|---|---------|--------|-------------|
| 1 | `src/compositions/BrandShowcase.tsx` composing 3 scenes via Sequence | **PRESENT** | Sequence from={0, 90, 180}, durationInFrames={90, 90, 120}. Total 300 frames. Exact match. |
| 2 | `src/compositions/scenes/TypographyScene.tsx` with Syne at weights 400, 600, 800 | **PRESENT** | loadFont at module level (line 7, outside component). Weights '400', '600', '800'. Uses useSpringFadeIn with staggered delays 0, 8, 16. |
| 3 | `src/compositions/scenes/BrandElementsScene.tsx` with colors, radius, cards | **PRESENT** | #EDE8E3 background, #8B2635 accent, BRAND.radius for borderRadius, 3 cards with useSpringScale staggered 6 frames apart. |
| 4 | `src/compositions/scenes/MotionTestScene.tsx` with spring-physics, deterministic | **PRESENT** | spring() with damping: 12, stiffness: 80. Uses `random('motion-seed')` from remotion. No Math.random(). Circle size is 120px (plan said 50px -- deviation). |
| 5 | `src/lib/animations.ts` with useSpringFadeIn, useSpringScale | **PRESENT** | Both exported. Both use spring() and interpolate() from remotion. |
| 6 | `src/lib/types.ts` with SceneConfig | **PRESENT** | Interface exported. **But never used anywhere** -- orphan. |
| 7 | `scripts/render.ts` with bundle, selectComposition, renderStill, renderMedia | **PRESENT** | All imports present. SCENES array, getScreenshotFrames, getScreenshotPath exported. Uses selectComposition (not deprecated getCompositions). Uses imageFormat: 'png', codec: 'h264', enableMultiProcessOnLinux: true. |
| 8 | `test/render.test.ts` with tests for SCENES config and screenshot logic | **PRESENT** | 8 tests covering SCENES array, getScreenshotFrames, getScreenshotPath. |
| 9 | Render script captures 3 screenshots per scene (start, midpoint, end) | **PARTIAL** | Plan specified start/mid/end frames: [0, 45, 89], [90, 135, 179], [180, 240, 299]. **Implementation changed** to quarter/mid/three-quarter: [22, 45, 67], [112, 135, 157], [210, 240, 270]. The tests were updated to match the new formula, so they pass. But this is a specification change from the plan. |
| 10 | render.ts exports render function for pipeline to call | **MISSING** | The `render()` function in render.ts is NOT exported. It's a private `async function render()`. Pipeline.ts re-implements the render logic inline instead of calling it. |

### Test Coverage

| Component | Status |
|-----------|--------|
| SCENES array (3 entries, names, frame ranges) | **TESTED** -- 3 tests |
| getScreenshotFrames (frame calculation) | **TESTED** -- 3 tests. Tests updated to match changed formula. |
| getScreenshotPath (path generation) | **TESTED** -- 2 tests |
| BrandShowcase composition structure | **UNTESTED** -- No test verifies Sequence structure, import chain, or total duration. |
| TypographyScene font loading | **UNTESTED** -- No test for loadFont at module level, weight rendering, or animation behavior. |
| BrandElementsScene visual structure | **UNTESTED** -- No test for card layout, colors, or radius. |
| MotionTestScene motion behavior | **UNTESTED** -- No test for spring physics, circle position, or deterministic random. |
| Animation helpers (useSpringFadeIn, useSpringScale) | **UNTESTED** -- These are React hooks; testing them requires a Remotion context. No tests exist. |
| Full render pipeline (bundle -> screenshot -> MP4) | **UNTESTED** -- Integration test not present. Only unit tests for helper functions. |

### Connection Integrity

| Connection | Status | Explanation |
|------------|--------|-------------|
| `BrandShowcase.tsx` -> `TypographyScene.tsx` | **CONNECTED** | import + Sequence wrapping |
| `BrandShowcase.tsx` -> `BrandElementsScene.tsx` | **CONNECTED** | import + Sequence wrapping |
| `BrandShowcase.tsx` -> `MotionTestScene.tsx` | **CONNECTED** | import + Sequence wrapping |
| `scripts/render.ts` -> `src/index.ts` (bundle entryPoint) | **CONNECTED** | `entryPoint: path.join(process.cwd(), 'src/index.ts')` |
| `scripts/render.ts` -> `@remotion/renderer` | **CONNECTED** | renderMedia, renderStill, selectComposition imports |
| `test/render.test.ts` -> `scripts/render.ts` | **CONNECTED** | Imports SCENES, getScreenshotFrames, getScreenshotPath |

### Orphans

| Item | Explanation |
|------|-------------|
| `render()` function in render.ts | Private function, only called by `require.main === module` guard. Pipeline.ts duplicates this logic instead of importing it. |
| `COMPOSITION_ID` in render.ts | Used only in the un-exported `render()` function. Pipeline.ts defines its own `COMPOSITION_ID`. |

### Critical Issues

| # | Issue | Severity | Explanation |
|---|-------|----------|-------------|
| **B-03** | **Screenshot frame numbers silently changed from plan specification** | **WARNING** | Plan specified start/mid/end [0,45,89] etc. Implementation uses quarter/mid/three-quarter [22,45,67] etc. Tests were updated to match. The rationale (letting spring animations settle) is reasonable but the change was not documented in the plan. |
| **B-04** | **render() function not exported; pipeline.ts duplicates render logic** | **WARNING** | Plan 01-04 key_links says pipeline.ts should import render function from render.ts. Instead, pipeline.ts copies the bundle/screenshot/renderMedia logic (lines 47-77), creating ~30 lines of code duplication. render.ts's `render()` function is dead code when using the pipeline. |
| **B-05** | **Circle size in MotionTestScene is 120px, plan specified 50px** | **WARNING** | Minor visual deviation from plan specification. |
| **B-06** | **`require.main === module` is a CommonJS idiom in ESM TypeScript** | **WARNING** | tsconfig uses `"module": "ES2022"`. While tsx handles this, it creates fragility if the project moves to pure ESM. Present in render.ts, verify.ts, and pipeline.ts. |

---

## Plan 01-03: Post-Render Validation Pipeline (TDD)

### Claimed Features

| # | Feature | Status | Explanation |
|---|---------|--------|-------------|
| 1 | `validateFileSize(fileSize)` -- catches files >= 1.8GB | **PRESENT** | Uses `FILE_SIZE_LIMIT = 1_932_735_283`. Returns {passed, value, limit}. |
| 2 | `validateResolution(width, height)` -- checks 1920x1080 | **PRESENT** | Exact equality check. Returns {passed, width, height}. |
| 3 | `validateFps(fps)` -- checks 30fps | **PRESENT** | Exact equality check. Returns {passed, value}. |
| 4 | `validateDuration(actual, expected)` -- within 0.5s tolerance | **PRESENT** | `Math.abs(actual - expected) <= 0.5`. Returns {passed} or {passed, actual, expected}. |
| 5 | `detectBlankFrame(path)` -- >98% same color = blank | **PARTIAL** | Threshold is 99.7% (BLANK_FRAME_THRESHOLD = 0.997), NOT 98% as the plan specified. The plan said ">98% of pixels are the same color", implementation uses >99.7%. This is more lenient (allows more frames to pass), which is a deviation. |
| 6 | `verifyFontRendering(path)` -- center-crop stddev > 25 | **PRESENT** | Crops center 50% (25% from each edge). Computes per-channel stddev, averages across R/G/B, compares against threshold 25. |
| 7 | `extractMetadata(filePath)` via ffprobe | **PRESENT** | Runs ffprobe with JSON output. Parses format.size, streams[0].width/height, r_frame_rate, format.duration. Path sanitization via shell metacharacter check. |
| 8 | `validateRender(mp4Path, screenshotsDir, expectedDuration)` | **PRESENT** | Orchestrates all checks. Writes report.json. Returns ValidationResult. |
| 9 | Validation exports `ValidationResult` type | **PRESENT** | Interface with passed, timestamp, checks object. |
| 10 | CLI entry point with correct exit codes | **PRESENT** | `require.main === module` guard. Exit 0 on pass, 1 on fail. |
| 11 | Path sanitization for ffprobe (T-01-06) | **PARTIAL** | Blocks `;|&$` and backtick but does NOT block quotes, path traversal (../), or spaces in filenames that could cause issues. The verification report noted this as CR-02. |
| 12 | Edge case: file not found | **PRESENT** | `fs.existsSync` check before ffprobe call. |
| 13 | Edge case: ffprobe not found | **PRESENT** | Catches execSync error, throws "ffprobe not found" message. |
| 14 | Edge case: screenshots dir empty | **PRESENT** | blankFrames defaults to passed=true (no frames to check). fontRendering set to passed=false with error message. |

### Test Coverage

| Component | Status |
|-----------|--------|
| validateFileSize (under, at, over limit) | **TESTED** -- 3 tests |
| validateResolution (correct, wrong, partial wrong) | **TESTED** -- 3 tests |
| validateFps (30, 24, 60) | **TESTED** -- 3 tests |
| validateDuration (within, at boundary, over) | **TESTED** -- 4 tests |
| detectBlankFrame (white, black, non-blank) | **TESTED** -- 3 tests |
| verifyFontRendering (varied, blank) | **TESTED** -- 2 tests |
| extractMetadata (normal, file-not-found, ffprobe-missing) | **UNTESTED** -- No unit test for metadata extraction. Would require mocking execSync or real ffprobe. |
| validateRender (full pipeline) | **UNTESTED** -- No integration test for the orchestration function. |
| Path sanitization (shell metacharacters) | **UNTESTED** -- No test verifies the metacharacter rejection. |
| CLI entry point (argument parsing, exit codes) | **UNTESTED** -- No test covers the CLI behavior. |

### Connection Integrity

| Connection | Status | Explanation |
|------------|--------|-------------|
| `scripts/verify.ts` -> `ffprobe` via execSync | **CONNECTED** | Shell command constructed with file path. |
| `scripts/verify.ts` -> `sharp` | **CONNECTED** | `import sharp from 'sharp'` |
| `test/validation.test.ts` -> `scripts/verify.ts` | **CONNECTED** | Imports all 6 validator functions. |

### Orphans

None found.

### Critical Issues

| # | Issue | Severity | Explanation |
|---|-------|----------|-------------|
| **B-07** | **Blank frame threshold changed from 98% to 99.7% without documentation** | **WARNING** | Plan says ">98% of pixels are the same color". Implementation uses 0.997 (99.7%). This makes the check more lenient -- frames with up to 99.6% identical pixels will pass. The comment says "allows small elements like motion circles" suggesting a deliberate change, but the plan was not updated. |
| **B-08** | **Shell injection protection is incomplete** | **WARNING** | The metacharacter pattern `/[;|&$\`]/` blocks 5 characters but does not block: quotes (`"` `'`), parentheses, newlines, or path traversal (`../`). In the current local-dev-only context this is low risk, but the threat model (T-01-06) claims this is "mitigated." It is partially mitigated at best. |
| **B-09** | **extractMetadata(), path sanitization, and CLI entry point are untested** | **WARNING** | Three significant code paths have zero test coverage. The TDD plan specified tests for the validation functions but extractMetadata (which uses exec/ffprobe) has no tests, not even with mocks. |

---

## Plan 01-04: Gallery, Deterministic Comparison, Pipeline Orchestrator

### Claimed Features

| # | Feature | Status | Explanation |
|---|---------|--------|-------------|
| 1 | `scripts/gallery.ts` generates self-contained HTML | **PRESENT** | DOCTYPE html, inline CSS, scene divs, frame img tags, validation summary, storyboard placeholder. |
| 2 | Gallery has `data-storyboard="placeholder"` for VERI-03 | **PRESENT** | `<div class="storyboard-slot" data-storyboard="placeholder"></div>` inside each scene div. |
| 3 | `scripts/compare.ts` with `compareFrames` and `compareAllFrames` | **PRESENT** | pixelmatch integration. Default threshold 0.001 (0.1%). PNG import from pngjs. |
| 4 | `scripts/pipeline.ts` orchestrates render -> validate -> gallery -> determinism | **PRESENT** | All 4 steps present. Gallery generated even on validation failure. Exit non-zero on failure. |
| 5 | Pipeline stops on validation failure but generates gallery | **PRESENT** | Lines 102-105: if !validation.passed, returns result after gallery generation. CLI entry exits with code 1. |
| 6 | Pipeline supports --skip-determinism flag | **PRESENT** | CLI parses args.includes('--skip-determinism'). |
| 7 | Pipeline supports --references flag | **PRESENT** | CLI parses args.indexOf('--references'). |
| 8 | `test/gallery.test.ts` | **PRESENT** | 7 tests covering HTML structure, scene names, img tags, validation data, storyboard placeholder. |
| 9 | `test/determinism.test.ts` | **PRESENT** | 6 tests covering identical images, different images, near-identical, and compareAllFrames. |
| 10 | `test/pipeline.test.ts` | **PRESENT** | 5 tests with full mocking of remotion, render, verify, gallery, compare modules. |
| 11 | `docker-compose.yml` render service uses pipeline script | **PRESENT** | `command: npx tsx scripts/pipeline.ts --skip-determinism` |
| 12 | Pipeline imports render function from scripts/render.ts | **MISSING** | Plan key_link says "import render function". Actual: imports only SCENES and getScreenshotFrames. Render logic duplicated inline. |

### Test Coverage

| Component | Status |
|-----------|--------|
| generateGallery (HTML output structure) | **TESTED** -- 7 tests |
| compareFrames (identical, different, near-identical, diffPercent range) | **TESTED** -- 4 tests |
| compareAllFrames (matching pairs, mismatched pairs) | **TESTED** -- 2 tests |
| Pipeline result shape | **TESTED** -- 1 test |
| Pipeline stop-on-failure | **TESTED** -- 1 test |
| Pipeline skip-determinism | **TESTED** -- 1 test |
| Pipeline runs determinism with references | **TESTED** -- 1 test |
| Pipeline output paths | **TESTED** -- 1 test |
| compareFrames dimension mismatch handling | **UNTESTED** -- No test for different-sized images. Will crash. |
| Gallery file writing (outputPath param) | **UNTESTED** -- Tests only check returned string, not file writing. |
| Pipeline CLI argument parsing | **UNTESTED** -- No test for --skip-determinism or --references CLI parsing. |

### Connection Integrity

| Connection | Status | Explanation |
|------------|--------|-------------|
| `scripts/pipeline.ts` -> `scripts/render.ts` | **PARTIAL** | Imports SCENES and getScreenshotFrames. Does NOT import render function (duplicates logic instead). |
| `scripts/pipeline.ts` -> `scripts/verify.ts` | **CONNECTED** | `import { validateRender } from './verify'` |
| `scripts/pipeline.ts` -> `scripts/gallery.ts` | **CONNECTED** | `import { generateGallery, type GalleryScene } from './gallery'` |
| `scripts/pipeline.ts` -> `scripts/compare.ts` | **CONNECTED** | `import { compareAllFrames } from './compare'` |
| `scripts/compare.ts` -> `pixelmatch` | **CONNECTED** | `import pixelmatch from 'pixelmatch'` |
| `test/pipeline.test.ts` -> `scripts/pipeline.ts` | **CONNECTED** | Imports runPipeline, PipelineResult. Full mocking of dependencies. |

### Orphans

None found specific to this plan.

### Critical Issues

| # | Issue | Severity | Explanation |
|---|-------|----------|-------------|
| **B-10** | **compareFrames does not validate image dimensions match** | **BLOCKER** | `scripts/compare.ts` line 22 uses `const { width, height } = actual` without checking that `reference` has the same dimensions. pixelmatch requires identical dimensions and will produce garbage output or throw if they differ. No guard, no test. |
| **B-11** | **Gallery test uses hardcoded plan frame numbers that don't match actual getScreenshotFrames output** | **WARNING** | gallery.test.ts uses frames [0, 45, 89, 90, 135, 179, 180, 240, 299] (plan spec). Actual getScreenshotFrames returns [22, 45, 67, 112, 135, 157, 210, 240, 270]. The gallery test passes because it constructs its own scene data and doesn't call getScreenshotFrames. But the test does not verify real pipeline behavior. |
| **B-12** | **Pipeline test mock of getScreenshotFrames uses different formula than actual implementation** | **WARNING** | pipeline.test.ts line 10-16 mocks getScreenshotFrames with `[start, mid, end]` formula. Actual uses `[quarter, mid, three-quarter]`. Mock doesn't match reality. Tests pass but don't validate real behavior. |

---

## Cross-Cutting Issues (All Plans)

| # | Issue | Severity | Explanation |
|---|-------|----------|-------------|
| **B-01** | **BLOCKER: tsx not available in render container** | **BLOCKER** | `tsx` is devDependency. Dockerfile.render uses `npm install --omit=dev`. docker-compose command requires `npx tsx`. Container will fail unless network-connected for npx to fetch tsx at runtime. |
| **B-10** | **BLOCKER: compareFrames crashes on dimension-mismatched images** | **BLOCKER** | No dimension check before pixelmatch call. |
| **B-03** | Screenshot frame numbers silently changed from start/mid/end to quarter/mid/three-quarter | **WARNING** | Specification change with no plan update. |
| **B-04** | render() function not exported; pipeline.ts duplicates ~30 lines of render logic | **WARNING** | Plan specified pipeline imports render function. |
| **B-07** | Blank frame threshold changed from 98% to 99.7% | **WARNING** | Plan specification change without documentation. |
| **B-08** | Shell injection protection incomplete in verify.ts | **WARNING** | Metacharacter pattern misses quotes, newlines, path traversal. |
| **B-09** | extractMetadata, path sanitization, CLI entry points have zero test coverage | **WARNING** | Significant code paths untested despite TDD plan. |
| **B-11** | Gallery test data doesn't match real pipeline frame numbers | **WARNING** | Test passes with wrong data. |
| **B-12** | Pipeline test mock doesn't match real getScreenshotFrames | **WARNING** | Mock behavior diverges from implementation. |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total claimed features (across all 4 plans)** | 49 |
| **Present and working** | 41 |
| **Partial (works but deviates from plan)** | 6 |
| **Missing** | 2 |
| | |
| **BLOCKER issues** | 2 |
| **WARNING issues** | 9 |
| | |
| **Test files** | 5 (Phase 1 scope) + 3 (later phases) = 8 total |
| **Total tests** | 139 passing (includes later-phase tests) |
| **Phase 1 tests** | ~44 across 5 files, all passing |
| **Testable components with zero coverage** | 8 (brand tokens, Docker builds, scene components, animation hooks, extractMetadata, path sanitization, CLI entry points, gallery file writing) |
| **Approximate Phase 1 test coverage** | ~55% of testable components |
| **Orphan structures** | 3 (unused `@remotion/transitions` dep, unused `@fontsource/syne` dep, unused `SceneConfig` type) |

### Honest Assessment

Phase 1 is **mostly functional** -- the pieces exist and connect. TypeScript compiles, all unit tests pass, the composition structure is correct, the validation pipeline covers the specified checks, and the Docker configuration is syntactically valid.

However, there are two genuine **blockers**:

1. **The render container cannot run its own pipeline command** without network access because `tsx` is missing from production dependencies. This means `docker compose run render` in an offline or CI environment will fail. The verification report identified this but left it unfixed, marking it as "human_needed."

2. **compareFrames will crash** when given images of different dimensions, with no guard or error handling. This is a data-integrity issue that will surface as soon as reference images are regenerated at a different resolution.

The **warning-level issues** are primarily about specification drift (frame numbers changed, thresholds changed, render logic duplicated) and test coverage gaps. Tests pass because they test the implementation as-built, not as-planned. Several mock objects in tests don't match real implementation behavior, which means the tests validate their own mocks rather than real code.

The **overall quality** of the code is reasonable -- well-structured, consistent style, proper TypeScript typing, clean imports. The issues are primarily at the integration and specification-adherence level, not at the line-by-line code quality level.

---

_Audited: 2026-05-14_
_Auditor: Claude Opus 4.6 (adversarial integrity audit)_
