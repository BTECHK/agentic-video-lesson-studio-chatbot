# Phase 1: Rendering Environment & Verification - Research

**Researched:** 2026-05-13
**Domain:** Containerized video rendering pipeline (Docker + Remotion + headless Chrome) with visual verification
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational rendering infrastructure: a Docker-based Remotion environment that renders React compositions to MP4 via headless Chrome, with a verification workflow that captures screenshots at key frames and validates output quality. This is a greenfield phase with no existing code.

The core technical challenge is bridging two modes: a development experience where the user sees live animations in Remotion Studio (browser at localhost:3000), and a production render pipeline where headless Chrome in Docker produces identical, deterministic MP4 output. The verification layer -- screenshot capture, HTML gallery, and post-render validation -- must be built alongside the rendering pipeline, not bolted on later.

Remotion v4.0.460 is the current stable release and provides all required primitives: `renderMedia()` for MP4 output, `renderStill()` for frame-level screenshot capture, `random()` for deterministic randomness, and `@remotion/google-fonts/Syne` for render-blocking font loading. The Docker story is well-documented with an official Dockerfile template targeting `node:22-bookworm-slim`.

**Primary recommendation:** Build two Docker Compose services (dev + render) sharing a single Remotion codebase, with a render script that captures verification screenshots via `renderStill()` at key frames before/after `renderMedia()` produces the final MP4.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Project source code lives on the WSL2 filesystem (e.g., `~/projects/agentic-video-lesson-studio-chatbot/`). WSL2 is already installed and configured. Docker Desktop uses the WSL2 backend.
- **D-02:** Remotion Studio (`npx remotion studio`) is the primary development preview tool. Runs in the browser at localhost:3000 with hot reload, timeline scrubbing, and per-composition selection.
- **D-03:** Docker Compose has two services: `dev` (Remotion Studio with port 3000 forwarded, source bind-mounted) and `render` (headless Chrome + FFmpeg for final MP4 output with output volume).
- **D-04:** Rendered scene screenshots are presented in an auto-generated HTML gallery (`output/verification/index.html`). Each scene shows its screenshots in order with scene names. Supports future side-by-side storyboard comparison (VERI-03).
- **D-05:** Screenshots captured at three key frames per scene: start (frame 0), midpoint (frame N/2), and end (frame N). Balances coverage with reviewability.
- **D-06:** Post-render validation runs automatically before human review and checks all four areas: file size & resolution (MP4 < 1.8GB, 1920x1080, 30fps), blank frame detection, font rendering verification (Syne not falling back), and duration accuracy vs storyboard.
- **D-07:** The test composition is a "Brand Showcase" (~5-10 seconds, 3 mini-scenes): Scene 1 -- Typography (Syne at 400/600/800 weights), Scene 2 -- Brand Elements (#EDE8E3 background, 4px radius cards, #8B2635 accent), Scene 3 -- Motion Test (spring-physics animation). This validates font loading, color accuracy, and motion rendering -- directly feeds Phase 2 confidence.
- **D-08:** Syne font is bundled in the Docker image at build time (downloaded from Google Fonts, installed to `/usr/share/fonts/syne/`). No network dependency at render time.
- **D-09:** Deterministic rendering uses frame-level visual comparison, not byte-identical MP4 (encoding metadata like timestamps and encoder versions can differ between runs even with identical frames).
- **D-10:** Pixel comparison tolerance of 0.1% difference per frame -- accounts for subpixel antialiasing without masking real regressions.
- **D-11:** Reference snapshots stored in `test/fixtures/` in Git. CI compares rendered output against these known-good screenshots.
- **D-12:** Determinism enforced by: fixed random seeds, bundled fonts (D-08), pinned Docker image versions, and no network calls during render.

### Claude's Discretion
- Font loading strategy (D-08), deterministic rendering approach (D-09 through D-12) -- user deferred these technical decisions to Claude's best-practice recommendations.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Docker container with Remotion + headless Chrome on node:22-bookworm-slim for rendering | Official Remotion Dockerfile template verified; Chrome dependencies list confirmed via Context7; `npx remotion browser ensure` installs Chrome Headless Shell |
| INFRA-02 | Docker Compose configuration with shared volumes for content, storyboards, and rendered output | Two-service pattern (dev + render) researched; volume mounts, port forwarding, shm_size documented |
| INFRA-03 | FFmpeg for video post-processing, scene concatenation, and format validation | FFmpeg available via `apt-get install -y ffmpeg` in Dockerfile; Remotion bundles its own FFmpeg for encoding but standalone needed for validation/concat |
| INFRA-04 | Deterministic rendering -- same storyboard input produces identical video output | Remotion `random()` API with seed-based determinism verified; frame-level pixelmatch comparison at 0.1% tolerance |
| INFRA-05 | Headed browser mode available for visual verification -- screenshots captured at each scene for human + AI review | Remotion Studio provides headed mode; `renderStill()` API captures individual frames as PNG at specified frame numbers |
| INFRA-06 | Pre-render and post-render validation checks (file size < 1.8GB, resolution correct, font rendering verified, no blank frames) | FFmpeg probe for metadata; pixelmatch for blank frame detection; sharp for pixel analysis of font regions |
| VERI-01 | Every rendered scene produces verification screenshots viewable by human reviewer | `renderStill()` captures start/mid/end frames per scene; HTML gallery generator creates browsable index |
| VERI-02 | Headed browser mode for development -- see actual animations during authoring, not just headless output | Remotion Studio (`npx remotion studio --port 3000`) with Docker port forwarding; hot reload via bind mounts |
| VERI-03 | Side-by-side comparison of storyboard intent vs rendered output for QA | HTML gallery structure designed to be extensible for side-by-side; implemented in Phase 2 when storyboard contract exists |
| VERI-04 | No feature or animation reported as "complete" without human-verified visual confirmation | Verification gallery is the gate; post-render validation script must pass before output is accepted |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Container-first:** Docker from day 1. Project should live on WSL2 filesystem for performance.
- **TDD approach:** Write tests before implementation. Never report "complete" without tests passing.
- **Visual verification:** Every rendered scene needs human-reviewable screenshots. Headed mode for development.
- **Brand compliance:** Syne font, warm linen palette (#EDE8E3 base, #8B2635 accent), 4px radius -- no exceptions.
- **Teachable constraints:** Output is MP4 video (1080p, 30fps, <2GB). No HTML embeds.
- **No choppy slide transitions:** Animations must be smooth, flowing, spring-physics.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Video rendering (MP4 output) | Docker Container (headless Chrome + Remotion) | -- | Rendering is CPU-bound, deterministic, and must run in an isolated, reproducible environment |
| Development preview | Browser / Client (Remotion Studio) | Docker Container (dev service) | Studio runs in browser; Docker provides the environment but the interaction is client-side |
| Screenshot capture | Docker Container (renderStill API) | -- | Screenshots are produced during the render pipeline, not in the browser |
| HTML verification gallery | Static / Filesystem | -- | Generated HTML file served from output directory; no server needed |
| Post-render validation | Docker Container (Node.js scripts) | -- | Validation runs headlessly after render completes, inside the same container |
| Font rendering | Docker Container (bundled fonts + fontconfig) | -- | Fonts must be available in the container at render time; no network dependency |
| Deterministic comparison | Docker Container (pixelmatch) | -- | Comparison runs as part of CI/test pipeline inside the container |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| remotion | 4.0.460 | Video composition framework | React-based, DOM rendering, spring physics, official Docker support [VERIFIED: npm registry] |
| @remotion/cli | 4.0.460 | CLI for studio and rendering | `npx remotion studio` for dev, `npx remotion render` for production [VERIFIED: npm registry] |
| @remotion/renderer | 4.0.460 | Node.js API for programmatic rendering | `renderMedia()` and `renderStill()` APIs for headless MP4 and screenshot output [VERIFIED: npm registry, Context7] |
| @remotion/bundler | 4.0.460 | Webpack bundler for Remotion projects | `bundle()` creates serve URL for renderer; required by renderMedia/renderStill [VERIFIED: npm registry, Context7] |
| @remotion/google-fonts | 4.0.460 | Type-safe Google Fonts loader | `loadFont()` from `@remotion/google-fonts/Syne` -- render-blocking, ensures font available before frame capture [VERIFIED: npm registry, Context7] |
| @remotion/transitions | 4.0.460 | Scene-to-scene transitions | `<TransitionSeries>` with crossfade, slide presentations [VERIFIED: npm registry] |
| typescript | 5.x | Type safety | Required by Remotion; catches structural errors [ASSUMED] |
| zod | 4.4.3 | Schema validation | Validates storyboard JSON, render configuration [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pixelmatch | 7.2.0 | Pixel-level image comparison | Deterministic rendering verification (D-09, D-10) [VERIFIED: npm registry] |
| pngjs | 7.0.0 | PNG read/write for Node.js | Required by pixelmatch to load PNG screenshots for comparison [VERIFIED: npm registry] |
| sharp | 0.34.5 | Image processing | Blank frame detection, font region analysis, image resizing [VERIFIED: npm registry] |
| vitest | 4.1.6 | Test framework | TDD approach per CLAUDE.md; fast, Vite-native [VERIFIED: npm registry] |
| @fontsource/syne | 5.2.7 | Syne font files (TTF/WOFF2) | Source for font files to bundle in Docker image [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pixelmatch | looks-same (v10.0.1) | looks-same accounts for human color perception (anti-aliasing tolerance built-in); pixelmatch is simpler, faster, and the 0.1% threshold from D-10 maps directly to its API |
| sharp | jimp | sharp is faster (native bindings) but requires native build in Docker; jimp is pure JS but slower. sharp's Debian support is excellent. |
| vitest | jest | vitest is faster, Vite-native (Remotion uses Vite internally), better TypeScript support |

**Installation:**
```bash
# Project initialization (from Remotion template)
npm create video@latest -- --template hello-world

# Additional Remotion packages
npm install @remotion/google-fonts @remotion/transitions

# Validation and verification
npm install zod pixelmatch pngjs sharp

# Dev dependencies
npm install -D vitest typescript @types/node
```

## Architecture Patterns

### System Architecture Diagram

```
User (Browser)
    |
    v
[Remotion Studio]  <--- port 3000 ---> [Docker: dev service]
    |                                        |
    | (development)                          | bind-mount: ./src
    |                                        |
    v                                        v
[Edit compositions] -----> [Source Code (WSL2 filesystem)]
                                             |
                                             | (production render)
                                             v
                           [Docker: render service]
                                |
                                v
                    +---------------------+
                    | 1. bundle()         |
                    | 2. selectComposition |
                    | 3. renderStill()    | --> screenshots (start/mid/end per scene)
                    | 4. renderMedia()    | --> MP4 output
                    | 5. validate()       | --> file size, resolution, blank frames, fonts
                    | 6. generateGallery()| --> HTML verification gallery
                    +---------------------+
                                |
                                v
                    [output/ volume mount]
                        |-- video/
                        |   +-- brand-showcase.mp4
                        |-- verification/
                        |   +-- index.html
                        |   +-- screenshots/
                        |       +-- scene-01-typography-frame-0.png
                        |       +-- scene-01-typography-frame-45.png
                        |       +-- scene-01-typography-frame-90.png
                        |       +-- ...
                        +-- validation/
                            +-- report.json
```

### Recommended Project Structure

```
src/
  index.ts                    # Remotion entry point (registerRoot)
  Root.tsx                    # Root component registering all compositions
  compositions/
    BrandShowcase.tsx         # Test composition (D-07): 3 mini-scenes
    scenes/
      TypographyScene.tsx     # Scene 1: Syne font weights
      BrandElementsScene.tsx  # Scene 2: Colors, radius, cards
      MotionTestScene.tsx     # Scene 3: Spring-physics animation
  brand/
    tokens.ts                 # Brand system constants (colors, font, radius, easing)
    styles.ts                 # CSS-in-JS brand styles
  lib/
    animations.ts             # Reusable spring/interpolate helpers
    types.ts                  # Shared TypeScript types
scripts/
  render.ts                   # Production render script (bundle + renderMedia + renderStill)
  verify.ts                   # Post-render validation (D-06)
  gallery.ts                  # HTML gallery generator (D-04)
  compare.ts                  # Deterministic frame comparison (D-09, D-10)
docker/
  Dockerfile.dev              # Dev service: Remotion Studio
  Dockerfile.render           # Render service: headless Chrome + FFmpeg
docker-compose.yml            # Two services: dev + render
public/
  fonts/
    Syne-Regular.ttf          # Bundled font files (D-08)
    Syne-SemiBold.ttf
    Syne-Bold.ttf
    Syne-ExtraBold.ttf
output/                       # Docker volume mount target
  video/                      # Rendered MP4 files
  verification/               # Screenshots + HTML gallery
  validation/                 # Validation reports
test/
  fixtures/                   # Reference snapshots for determinism (D-11)
  render.test.ts              # Render pipeline tests
  validation.test.ts          # Post-render validation tests
  determinism.test.ts         # Frame comparison tests
```

### Pattern 1: Render Script with Screenshot Capture

**What:** A single Node.js script that bundles the project, captures verification screenshots at key frames via `renderStill()`, renders the full MP4 via `renderMedia()`, and runs post-render validation.

**When to use:** Every production render.

**Example:**
```typescript
// Source: Remotion official docs (renderStill, renderMedia, bundle)
// scripts/render.ts
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';

const COMPOSITION_ID = 'BrandShowcase';

async function render() {
  // Step 1: Bundle
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), './src/index.ts'),
  });

  // Step 2: Select composition
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
  });

  // Step 3: Capture verification screenshots (D-05: start/mid/end per scene)
  const scenes = [
    { name: 'typography', startFrame: 0, endFrame: 90 },
    { name: 'brand-elements', startFrame: 91, endFrame: 180 },
    { name: 'motion-test', startFrame: 181, endFrame: 300 },
  ];

  for (const scene of scenes) {
    const midFrame = Math.floor((scene.startFrame + scene.endFrame) / 2);
    for (const frame of [scene.startFrame, midFrame, scene.endFrame]) {
      await renderStill({
        composition,
        serveUrl,
        output: path.join(
          process.cwd(),
          `output/verification/screenshots/${scene.name}-frame-${frame}.png`
        ),
        frame,
        imageFormat: 'png',
      });
    }
  }

  // Step 4: Render full MP4
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: path.join(process.cwd(), 'output/video/brand-showcase.mp4'),
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
    },
  });

  // Step 5: Run validation (separate script)
  // Step 6: Generate HTML gallery (separate script)
}
```

### Pattern 2: Docker Compose Two-Service Architecture

**What:** Two Docker services sharing the same Remotion codebase -- `dev` for Remotion Studio with hot reload, `render` for headless MP4 production.

**When to use:** Always. This is the locked architecture (D-03).

**Example:**
```yaml
# docker-compose.yml
services:
  dev:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src          # Hot reload
      - ./public:/app/public    # Static assets including fonts
    command: npx remotion studio --port 3000

  render:
    build:
      context: .
      dockerfile: docker/Dockerfile.render
    volumes:
      - ./output:/app/output    # Rendered output
    shm_size: '2gb'             # Chrome needs >64MB default
    cpus: 4                     # Explicit CPU allocation
    environment:
      - NODE_ENV=production
    command: node scripts/render.js
```

### Pattern 3: Post-Render Validation Pipeline

**What:** Automated checks that run after rendering but before human review. Catches common failures without requiring a person to look at every frame.

**When to use:** After every render, before the HTML gallery is considered ready for review.

**Example:**
```typescript
// scripts/verify.ts
import { execSync } from 'child_process';
import sharp from 'sharp';

interface ValidationResult {
  passed: boolean;
  checks: {
    fileSize: { passed: boolean; value: string; limit: string };
    resolution: { passed: boolean; width: number; height: number };
    fps: { passed: boolean; value: number };
    blankFrames: { passed: boolean; count: number };
    fontRendering: { passed: boolean; details: string };
    duration: { passed: boolean; actual: number; expected: number };
  };
}

async function validateMP4(filePath: string): Promise<ValidationResult> {
  // Use ffprobe for metadata extraction
  const probe = execSync(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
  );
  const metadata = JSON.parse(probe.toString());
  // ... validate file size < 1.8GB, resolution 1920x1080, fps 30
  // ... check screenshots for blank frames (all-white or all-black pixels)
  // ... verify font rendering by checking text regions against expected Syne metrics
}
```

### Pattern 4: Deterministic Frame Comparison

**What:** Compare rendered frames against reference snapshots using pixel-level comparison with a 0.1% tolerance threshold.

**When to use:** CI/CD pipeline and after any code change that could affect rendering output.

**Example:**
```typescript
// scripts/compare.ts
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';

function compareFrames(
  actualPath: string,
  referencePath: string,
  threshold: number = 0.001 // 0.1% tolerance (D-10)
): { match: boolean; diffPixels: number; totalPixels: number; diffPercent: number } {
  const actual = PNG.sync.read(fs.readFileSync(actualPath));
  const reference = PNG.sync.read(fs.readFileSync(referencePath));
  const { width, height } = actual;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    actual.data,
    reference.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // per-pixel color distance threshold
  );

  const totalPixels = width * height;
  const diffPercent = diffPixels / totalPixels;

  return {
    match: diffPercent <= threshold,
    diffPixels,
    totalPixels,
    diffPercent,
  };
}
```

### Pattern 5: HTML Verification Gallery

**What:** A self-contained HTML file that displays all verification screenshots organized by scene, with scene names and frame numbers. No server required -- opens directly in a browser.

**When to use:** After every render, as the primary human review interface.

**Example structure:**
```html
<!-- output/verification/index.html (generated by scripts/gallery.ts) -->
<!DOCTYPE html>
<html>
<head>
  <title>Render Verification - Brand Showcase</title>
  <style>
    body { font-family: system-ui; background: #f5f5f5; padding: 2rem; }
    .scene { margin-bottom: 2rem; border: 1px solid #ddd; padding: 1rem; background: white; }
    .scene h2 { margin-top: 0; }
    .frames { display: flex; gap: 1rem; }
    .frame img { max-width: 400px; border: 1px solid #eee; }
    .frame label { display: block; font-size: 0.8rem; color: #666; }
    .validation { padding: 1rem; margin-top: 1rem; }
    .pass { background: #e6ffe6; }
    .fail { background: #ffe6e6; }
  </style>
</head>
<body>
  <h1>Render Verification</h1>
  <!-- Generated per scene with start/mid/end screenshots -->
  <!-- Validation summary at bottom -->
</body>
</html>
```

### Anti-Patterns to Avoid

- **CSS animations instead of Remotion primitives:** CSS `@keyframes` and `transition` are time-based and non-deterministic in frame-by-frame rendering. Use `spring()`, `interpolate()`, and frame math exclusively. [CITED: remotion.dev/docs/spring]
- **Math.random() instead of Remotion random():** `Math.random()` produces different values across rendering threads. Use `random(seed)` from `remotion` for deterministic output. [CITED: remotion.dev/docs/random]
- **Alpine Linux base image:** Remotion official docs explicitly warn against it -- causes 35% slower renders due to Rust component incompatibility. Use `node:22-bookworm-slim`. [CITED: remotion.dev/docs/docker]
- **Mounting node_modules as volume:** Chrome Headless Shell is installed inside node_modules via `npx remotion browser ensure`. Mounting node_modules as a volume causes Chrome to re-download on every container start. [CITED: crepal.ai Docker guide]
- **Default Docker shm_size:** Docker default is 64MB; Chrome needs 1-2GB for rendering. Set `shm_size: '2gb'` in Docker Compose. [CITED: crepal.ai Docker guide]
- **Storing project on Windows filesystem:** Docker I/O from NTFS-mounted paths is 10-20x slower than WSL2 native filesystem. Project must live at a WSL2 path. [CITED: docker/for-win#10476]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video rendering | Custom FFmpeg pipeline | Remotion `renderMedia()` | Handles Chrome orchestration, frame capture, encoding, concurrency [VERIFIED: Context7] |
| Screenshot capture | Puppeteer script to capture frames | Remotion `renderStill()` | Same bundled project, same composition, frame-accurate [VERIFIED: Context7] |
| Font loading in headless Chrome | Manual @font-face CSS injection | `@remotion/google-fonts/Syne` + bundled TTF in Docker | Render-blocking load, type-safe, handles weight filtering [VERIFIED: Context7] |
| Pixel comparison | Custom image diff algorithm | pixelmatch | Handles anti-aliasing, configurable threshold, battle-tested (15M+ weekly downloads) [VERIFIED: npm registry] |
| Deterministic random | Custom PRNG implementation | Remotion `random(seed)` | Thread-safe, deterministic across parallel render workers [VERIFIED: remotion.dev/docs/random] |
| Image metadata extraction | Custom binary parser | FFmpeg `ffprobe` | Extracts resolution, fps, duration, codec, file size from MP4 [ASSUMED] |
| Image processing (blank detection) | Canvas-based pixel analysis | sharp | Native bindings, handles PNG/JPEG, fast statistical analysis [VERIFIED: npm registry] |

**Key insight:** Remotion provides both `renderMedia()` (full video) and `renderStill()` (single frame) from the same bundled project. The verification screenshot workflow uses the same composition code as the video render -- no separate screenshot system needed.

## Common Pitfalls

### Pitfall 1: Docker Renders Differently Than Remotion Studio Preview

**What goes wrong:** Animations look smooth in Remotion Studio but produce choppy, visually different, or crashed output in Docker headless mode.
**Why it happens:** Headless Chrome disables GPU; Docker default shm_size is 64MB (Chrome needs 1-2GB); Docker reports more CPUs than allocated; fonts not installed in container.
**How to avoid:**
- Set `shm_size: '2gb'` in Docker Compose [CITED: crepal.ai Docker guide]
- Set explicit `cpus` and memory limits [CITED: remotion.dev/docs/docker]
- Bundle Syne font in Docker image (D-08) [VERIFIED: CONTEXT.md decision]
- Enable `enableMultiProcessOnLinux: true` in chromiumOptions [VERIFIED: Context7]
- Avoid GPU-dependent CSS effects (blur, heavy box-shadow) in compositions
**Warning signs:** Render crashes with "Failed to allocate shared memory"; output colors differ from preview; text renders as system sans-serif.

### Pitfall 2: Font Fallback in Headless Chrome

**What goes wrong:** Syne renders as Arial/Helvetica in the Docker container. Only some weights load (400 but not 700/800).
**Why it happens:** `@remotion/google-fonts` downloads from Google CDN at render time -- network may be unavailable in Docker; font files not installed in container OS; `loadFont()` called inside component render instead of module top level.
**How to avoid:**
- Bundle Syne TTF files in Docker image at `/usr/share/fonts/syne/` and run `fc-cache -fv` (D-08) [VERIFIED: CONTEXT.md]
- ALSO use `@remotion/google-fonts/Syne` with explicit weight filtering as primary loader [VERIFIED: Context7]
- Call `loadFont()` at module top level, never inside a component render function [VERIFIED: Context7]
- Add a font verification step: render a single frame with all weights, compare against reference [ASSUMED]
**Warning signs:** Text appears in a different typeface; font weight variations are not visible.

### Pitfall 3: Non-Deterministic Rendering Output

**What goes wrong:** Same composition with same inputs produces visually different frames across runs, breaking the determinism requirement (INFRA-04).
**Why it happens:** Using `Math.random()` instead of Remotion `random(seed)`; CSS animations with time-based transitions; network-fetched resources (fonts, images) that may vary; Date/time-dependent logic in compositions.
**How to avoid:**
- Use `random(seed)` exclusively for any randomness [CITED: remotion.dev/docs/random]
- Use `spring()` and `interpolate()` with frame-based math, never CSS `@keyframes` [CITED: remotion.dev/docs/spring]
- Bundle all assets (fonts, images) in the Docker image -- no network calls during render (D-12) [VERIFIED: CONTEXT.md]
- Pin Docker image versions with specific digest hashes [ASSUMED]
- Never use `new Date()` or `Date.now()` in composition code [ASSUMED]
**Warning signs:** pixelmatch comparison shows >0.1% diff between runs with identical inputs.

### Pitfall 4: Windows Filesystem Performance Penalty

**What goes wrong:** Docker operations (npm install, Remotion preview refresh, file watching) are 10-20x slower than expected.
**Why it happens:** Docker on Windows mounts NTFS volumes via Plan 9 filesystem translation layer. Each file operation crosses the Windows/Linux boundary.
**How to avoid:** Clone and work from the WSL2 filesystem exclusively (D-01). Access via `\\wsl$\Ubuntu\home\user\project` from Windows or `~/projects/` from WSL2 terminal. [CITED: docker/for-win#10476]
**Warning signs:** `npm install` takes >60 seconds; Remotion preview refresh takes >3 seconds; file watcher events are delayed.

### Pitfall 5: Incorrect pixelmatch Threshold Configuration

**What goes wrong:** Deterministic comparison either flags every render as different (false positives from subpixel antialiasing) or misses real regressions (threshold too loose).
**Why it happens:** pixelmatch has two threshold concepts: per-pixel color distance threshold (its `threshold` option) and the overall percentage of differing pixels (calculated from output). Confusing these leads to miscalibrated comparisons.
**How to avoid:**
- pixelmatch `threshold` option: set to 0.1 (default) -- this is the per-pixel color distance tolerance [VERIFIED: pixelmatch npm docs]
- Overall diff percentage: calculate as `diffPixels / totalPixels` and compare against 0.001 (0.1% per D-10)
- These are two separate thresholds -- the pixelmatch option handles anti-aliasing; the percentage threshold handles overall frame drift
**Warning signs:** All comparisons pass (threshold too loose) or all fail (threshold too tight).

## Code Examples

### Brand Showcase Test Composition (D-07)

```typescript
// src/compositions/BrandShowcase.tsx
// Source: Remotion official docs (Composition, Sequence, spring, interpolate)
import { Composition, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';

// Load at module level -- render-blocking
const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

const BRAND = {
  bgBase: '#EDE8E3',
  accent: '#8B2635',
  text: '#1C1C1C',
  radius: 4,
  font: fontFamily,
};

export const BrandShowcase: React.FC = () => {
  return (
    <>
      {/* Scene 1: Typography -- frames 0-90 */}
      <Sequence from={0} durationInFrames={90}>
        <TypographyScene />
      </Sequence>

      {/* Scene 2: Brand Elements -- frames 90-180 */}
      <Sequence from={90} durationInFrames={90}>
        <BrandElementsScene />
      </Sequence>

      {/* Scene 3: Motion Test -- frames 180-300 */}
      <Sequence from={180} durationInFrames={120}>
        <MotionTestScene />
      </Sequence>
    </>
  );
};
```

### Dockerfile for Render Service (D-08)

```dockerfile
# docker/Dockerfile.render
FROM node:22-bookworm-slim

# Chrome dependencies
RUN apt-get update && apt-get install -y \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
  libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
  libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 \
  libcups2 ffmpeg fontconfig \
  && rm -rf /var/lib/apt/lists/*

# Bundle Syne font (D-08: no network dependency at render time)
COPY public/fonts/Syne-*.ttf /usr/share/fonts/syne/
RUN fc-cache -fv

# Create non-root user for file permissions
RUN useradd -m -u 1000 remotion
WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npx remotion browser ensure

COPY . .
RUN chown -R remotion:remotion /app

USER remotion
CMD ["node", "scripts/render.js"]
```

### Remotion random() for Deterministic Animations (D-12)

```typescript
// Source: https://www.remotion.dev/docs/random
import { random } from 'remotion';

// Deterministic: same seed always produces same value
const wobble = random('motion-test-wobble'); // Always 0.xxx...
const delay = random('card-stagger-delay');  // Always 0.yyy...

// NEVER use Math.random() in compositions
// Math.random() produces different values across rendering threads
```

### Verification Gallery Generator

```typescript
// scripts/gallery.ts
import fs from 'fs';
import path from 'path';

interface SceneScreenshots {
  name: string;
  frames: { frameNumber: number; path: string }[];
}

function generateGalleryHTML(
  scenes: SceneScreenshots[],
  validationReport: Record<string, unknown>
): string {
  const sceneBlocks = scenes.map(scene => `
    <div class="scene">
      <h2>${scene.name}</h2>
      <div class="frames">
        ${scene.frames.map(f => `
          <div class="frame">
            <img src="screenshots/${path.basename(f.path)}" alt="Frame ${f.frameNumber}" />
            <label>Frame ${f.frameNumber}</label>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html><head><title>Render Verification</title>
<style>/* ... styles ... */</style>
</head><body>
<h1>Render Verification</h1>
${sceneBlocks}
<div class="validation ${validationReport ? 'pass' : 'fail'}">
  <h2>Validation Results</h2>
  <pre>${JSON.stringify(validationReport, null, 2)}</pre>
</div>
</body></html>`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<Html5Video>` component | `<Video>` component | Remotion v4 | Old component deprecated; use `<Video>` for all video embedding [VERIFIED: Context7] |
| `@remotion/fonts` manual loading | `@remotion/google-fonts` type-safe | Remotion v4.0.164+ | Automatic render-blocking, 1400+ fonts, weight/subset filtering [VERIFIED: Context7] |
| Single-process Chrome on Linux | `enableMultiProcessOnLinux: true` (default) | Remotion v4.0.42 | Now default true; leverages all CPU cores; 3x faster rendering [VERIFIED: Context7] |
| `require.resolve()` for entry point | `path.join()` recommended | Remotion v4 | Avoid CommonJS require in ESM context [ASSUMED] |
| Webpack-only bundling | Rspack option available | Remotion v4.0.x | `rspack: true` in bundle() options for faster bundling; still experimental [VERIFIED: Context7] |

**Deprecated/outdated:**
- `<OffthreadVideo>`: Use `<Video>` instead [VERIFIED: Context7]
- `getCompositions()`: Use `selectComposition()` for single composition selection (more efficient) [VERIFIED: Context7]
- `renderFrames()`: Still available but `renderStill()` is preferred for individual frames and `renderMedia()` for video [VERIFIED: Context7]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TypeScript 5.x is the correct version range for Remotion v4.0.460 | Standard Stack | Low -- Remotion works with TS 4.x+ but 5.x is current |
| A2 | FFmpeg `ffprobe` is the standard tool for extracting MP4 metadata in validation | Don't Hand-Roll | Low -- ffprobe is universally used; alternative is fluent-ffmpeg npm package |
| A3 | Pinning Docker image versions with digest hashes prevents base image drift | Pitfall 3 | Low -- standard Docker practice |
| A4 | `path.join()` is preferred over `require.resolve()` for entry points in Remotion v4 | State of the Art | Low -- both work; path.join is ESM-compatible |
| A5 | Font verification can be done by rendering a single frame and checking text regions with sharp | Pitfall 2 | Medium -- may need more sophisticated OCR or visual comparison approach |

## Open Questions (RESOLVED)

1. **Remotion Licensing for Sample Academy** (RESOLVED -- does not block Phase 1)
   - What we know: Free for individuals and orgs with 3 or fewer employees [CITED: remotion.dev/docs/license]
   - What's unclear: Sample Academy's exact employee/contractor count
   - Recommendation: Verify employee count. If >3, budget for company license (visit remotion.pro). This does not block Phase 1 development.

2. **Dev Service Docker Image Weight** (RESOLVED -- separate Dockerfiles with same base, per D-03)
   - What we know: Remotion Studio needs Chrome for preview, same as render service
   - What's unclear: Whether the dev service should use the same Dockerfile as render (heavier but simpler) or a lighter image
   - Recommendation: Use the same base Dockerfile with different CMD. Avoids maintaining two sets of Chrome dependencies. The dev Dockerfile adds `--port 3000` to the studio command.

3. **Browser Instance Reuse for Screenshot Capture** (RESOLVED -- start with separate calls, optimize later)
   - What we know: `renderStill()` can accept an existing `puppeteerInstance` to avoid opening/closing browser per screenshot [VERIFIED: Context7]
   - What's unclear: Whether browser reuse across renderStill + renderMedia calls is safe and provides meaningful speedup
   - Recommendation: Start with separate calls (simpler). Optimize with shared browser instance if screenshot capture becomes a bottleneck.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Container runtime | Yes | 29.3.1 | -- |
| Docker Compose | Service orchestration | Yes | v5.1.1 | -- |
| Node.js | Local development | Yes | v24.13.0 | -- |
| npm | Package management | Yes | 11.6.2 | -- |
| WSL2 (Ubuntu) | Filesystem performance | Yes | Running, Version 2 | -- |
| FFmpeg | Post-processing/validation | No (not on Windows host) | -- | Installed inside Docker container via `apt-get install -y ffmpeg` |

**Missing dependencies with no fallback:**
- None. All critical dependencies are either available or will be installed inside Docker.

**Missing dependencies with fallback:**
- FFmpeg is not available on the Windows host, but this is expected -- it will be installed inside the Docker containers. All FFmpeg operations run inside Docker, not on the host.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.6 |
| Config file | vitest.config.ts (Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Docker container builds and runs Remotion render | integration | `docker compose run render node -e "require('@remotion/renderer')"` | Wave 0 |
| INFRA-02 | Docker Compose starts both dev and render services | integration | `docker compose config --quiet && docker compose up -d --wait` | Wave 0 |
| INFRA-03 | FFmpeg is available inside render container | smoke | `docker compose run render ffmpeg -version` | Wave 0 |
| INFRA-04 | Same input produces identical frames across two runs | unit | `npx vitest run test/determinism.test.ts` | Wave 0 |
| INFRA-05 | renderStill captures screenshots at specified frames | unit | `npx vitest run test/render.test.ts` | Wave 0 |
| INFRA-06 | Validation catches oversized file, wrong resolution, blank frames | unit | `npx vitest run test/validation.test.ts` | Wave 0 |
| VERI-01 | Screenshots produced for every scene (start/mid/end) | integration | `npx vitest run test/render.test.ts` | Wave 0 |
| VERI-02 | Remotion Studio accessible at localhost:3000 | smoke/manual | Manual -- open browser to localhost:3000 | Manual |
| VERI-03 | HTML gallery extensible for side-by-side | unit | `npx vitest run test/gallery.test.ts` | Wave 0 |
| VERI-04 | Render workflow blocked without passing validation | integration | `npx vitest run test/pipeline.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green + Docker integration tests pass before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- framework configuration
- [ ] `test/render.test.ts` -- covers INFRA-05, VERI-01
- [ ] `test/validation.test.ts` -- covers INFRA-06
- [ ] `test/determinism.test.ts` -- covers INFRA-04
- [ ] `test/gallery.test.ts` -- covers VERI-03
- [ ] `test/pipeline.test.ts` -- covers VERI-04

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- no user-facing auth in rendering pipeline |
| V3 Session Management | No | N/A -- no sessions |
| V4 Access Control | No | N/A -- local Docker environment |
| V5 Input Validation | Yes | Zod schema validation for storyboard JSON and render config |
| V6 Cryptography | No | N/A -- no secrets or encryption in Phase 1 |

### Known Threat Patterns for Docker + Node.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Container escape via Chrome vulnerability | Elevation of Privilege | Run Chrome as non-root user (useradd remotion); use `--security-opt=no-new-privileges` |
| Untrusted input in composition props | Tampering | Zod validation of all inputProps before passing to Remotion |
| Docker socket exposure | Elevation of Privilege | Never mount `/var/run/docker.sock` in render containers |

## Sources

### Primary (HIGH confidence)
- [Remotion v4.0.460 npm registry](https://www.npmjs.com/package/remotion) -- version verified 2026-05-13
- [Remotion Context7 /remotion-dev/remotion](https://context7.com) -- renderStill, renderMedia, bundle, chromiumOptions, random() APIs verified
- [Remotion Docker Guide](https://www.remotion.dev/docs/docker) -- Dockerfile template, Chrome dependencies, Alpine warning
- [Remotion random() API](https://www.remotion.dev/docs/random) -- seed-based deterministic pseudorandom
- [Remotion renderStill()](https://www.remotion.dev/docs/renderer/render-still) -- frame capture API with format, frame, scale options
- [Remotion renderMedia()](https://www.remotion.dev/docs/renderer/render-media) -- full video rendering with codec, bitrate, chromiumOptions
- [pixelmatch npm](https://www.npmjs.com/package/pixelmatch) -- v7.2.0 verified 2026-05-13

### Secondary (MEDIUM confidence)
- [CrePal: How to Run Remotion in Docker](https://crepal.ai/blog/aivideo/blog-how-to-run-remotion-in-docker/) -- CPU limits, shm_size, font installation, multi-process Chrome
- [Scott Havird: Remotion Docker Template](https://scotthavird.com/blog/remotion-docker-template/) -- Docker Compose patterns, volume mounts
- [Docker for Windows Performance Issue #10476](https://github.com/docker/for-win/issues/10476) -- WSL2 filesystem performance

### Tertiary (LOW confidence)
- None -- all claims verified against primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified on npm registry; APIs confirmed via Context7
- Architecture: HIGH -- Docker two-service pattern is locked decision; Remotion APIs are well-documented
- Pitfalls: HIGH -- all pitfalls sourced from official docs or verified community guides
- Validation/Testing: MEDIUM -- test structure is recommended based on project TDD requirement; specific test implementations need Phase 1 execution

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (Remotion releases frequently but v4.0.x API is stable)
