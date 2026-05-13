---
phase: 01-rendering-environment
reviewed: 2026-05-13T02:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - .dockerignore
  - docker-compose.yml
  - docker/Dockerfile.dev
  - docker/Dockerfile.render
  - package.json
  - remotion.config.ts
  - scripts/compare.ts
  - scripts/gallery.ts
  - scripts/pipeline.ts
  - scripts/render.ts
  - scripts/verify.ts
  - src/Root.tsx
  - src/brand/tokens.ts
  - src/compositions/BrandShowcase.tsx
  - src/compositions/scenes/BrandElementsScene.tsx
  - src/compositions/scenes/MotionTestScene.tsx
  - src/compositions/scenes/TypographyScene.tsx
  - src/index.ts
  - src/lib/animations.ts
  - src/lib/types.ts
  - test/determinism.test.ts
  - test/gallery.test.ts
  - test/pipeline.test.ts
  - test/render.test.ts
  - test/validation.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 3
  warning: 4
  info: 0
  total: 7
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-13T02:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Phase 1 implements a Remotion v4 rendering environment with Docker containerization, post-render validation (ffprobe-based metadata checks, blank frame detection, font rendering verification), a verification gallery generator, and a deterministic frame comparison system. The code is generally well-structured with clear separation of concerns.

However, three critical issues block production use: (1) a missing `tsx` dependency makes the render container unable to execute its configured command, (2) incomplete shell metacharacter sanitization in the ffprobe path leaves a command injection vector, and (3) the frame comparison function will crash or produce corrupt results when image dimensions differ. Four additional warnings cover XSS in the gallery HTML, a misleading `allMatch: true` result when no references exist, an inaccurate pipeline test mock, and hardcoded brand colors duplicated outside the token file.

## Critical Issues

### CR-01: Missing `tsx` dependency breaks render container

**File:** `package.json` (entire file), `docker-compose.yml:23`
**Issue:** The render service in `docker-compose.yml` executes `npx tsx scripts/pipeline.ts --skip-determinism`, but `tsx` is not listed in `package.json` -- neither in `dependencies` nor `devDependencies`. The render Dockerfile installs with `npm install --omit=dev`, so even if `tsx` were in devDependencies it would be missing. The container will fail at startup because `npx tsx` will either attempt a network download at runtime (fragile, non-deterministic) or fail entirely in an air-gapped environment.
**Fix:** Add `tsx` to `dependencies` (since the render container needs it in production mode):
```json
"dependencies": {
  "tsx": "^4.19.0",
  ...
}
```
Alternatively, pre-compile the TypeScript scripts to JavaScript during the Docker build step and run the compiled output with `node`.

### CR-02: Incomplete shell injection sanitization in ffprobe path

**File:** `scripts/verify.ts:45,182-184`
**Issue:** The `SHELL_METACHAR_PATTERN` regex `/[;|&$\`]/` blocks some metacharacters but does not block double quotes (`"`), which can break out of the double-quoted interpolation in the ffprobe command on line 183: `` `ffprobe ... "${filePath}"` ``. A file path containing `"` followed by shell commands could achieve injection. Additionally, newline characters (`\n`, `\r`) are not blocked; a newline can terminate the command and start a new one. While `fs.existsSync` on line 176 limits exploitability (the file must exist on disk with that exact name), the sanitization is still insufficient for defense-in-depth.
**Fix:** Replace `execSync` with `execFileSync` which avoids shell interpretation entirely:
```typescript
import { execFileSync } from 'child_process';

export function extractMetadata(filePath: string): VideoMetadata {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let probeOutput: string;
  try {
    probeOutput = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ], { encoding: 'utf-8' });
  } catch {
    throw new Error('ffprobe not found -- is FFmpeg installed?');
  }
  // ... rest unchanged
}
```
This eliminates the shell entirely and makes the `SHELL_METACHAR_PATTERN` unnecessary.

### CR-03: Frame comparison crashes on dimension mismatch

**File:** `scripts/compare.ts:21-33`
**Issue:** `compareFrames` reads width/height from `actual` (line 24) but passes `reference.data` to `pixelmatch` without verifying that `reference` has the same dimensions. If the actual and reference images differ in size, `pixelmatch` will either throw an error (buffer length mismatch) or read out-of-bounds memory, producing undefined behavior. The function signature accepts arbitrary file paths with no dimension check.
**Fix:** Add a dimension check before calling pixelmatch:
```typescript
const actual = PNG.sync.read(actualData);
const reference = PNG.sync.read(referenceData);

if (actual.width !== reference.width || actual.height !== reference.height) {
  return {
    match: false,
    diffPixels: actual.width * actual.height,
    totalPixels: actual.width * actual.height,
    diffPercent: 1,
  };
}
```

## Warnings

### WR-01: Gallery HTML generator vulnerable to XSS via unescaped interpolation

**File:** `scripts/gallery.ts:18,24-25,38`
**Issue:** `scene.name`, `f.filename`, `f.frameNumber`, and the `JSON.stringify(validationReport)` output are interpolated directly into HTML template literals without escaping. If any of these values contain HTML special characters (`<`, `>`, `"`, `&`), they will be injected into the DOM. While the gallery is a local verification file (not served to end users), a malformed scene name or validation error message containing `<script>` would execute when opened in a browser.
**Fix:** Add an HTML escape helper and apply it to all interpolated values:
```typescript
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Then use:
<h2>${escapeHtml(scene.name)}</h2>
<pre>${escapeHtml(JSON.stringify(validationReport, null, 2))}</pre>
```

### WR-02: `compareAllFrames` silently returns `allMatch: true` when no references exist

**File:** `scripts/compare.ts:59-64,80`
**Issue:** When a reference file does not exist for a given screenshot, the loop `continue`s (line 64), skipping that file. If no reference files exist at all (empty or wrong directory), the function returns `{ allMatch: true, results: {} }`. This is a false positive -- the caller (pipeline.ts line 114) would log "All frames match reference snapshots" when no comparison actually occurred.
**Fix:** After the loop, check that at least one comparison was performed:
```typescript
if (Object.keys(results).length === 0) {
  return { allMatch: false, results };
}
```
Or alternatively, track skipped files and include that count in the result.

### WR-03: Pipeline test mock diverges from actual `getScreenshotFrames` implementation

**File:** `test/pipeline.test.ts:10-16`
**Issue:** The mock of `getScreenshotFrames` returns `[start, mid, end]` (e.g., `[0, 45, 89]` for typography), but the actual implementation in `scripts/render.ts:14-24` returns `[quarter, mid, threeQuarter]` (e.g., `[22, 45, 67]`). The mock produces different frame numbers than reality. While this doesn't cause test failures (since `renderStill` is also mocked), it means the test cannot detect regressions in frame selection logic and the frame filenames passed to `generateGallery` in the test differ from what the real pipeline would produce.
**Fix:** Update the mock to match the actual implementation:
```typescript
getScreenshotFrames: vi.fn((scene: { startFrame: number; endFrame: number }) => {
  const start = scene.startFrame;
  const end = scene.endFrame;
  const duration = end - start + 1;
  const quarter = start + Math.floor(duration * 0.25);
  const mid = start + Math.floor(duration * 0.5);
  const threeQuarter = start + Math.floor(duration * 0.75);
  return [quarter, mid, threeQuarter];
}),
```

### WR-04: Hardcoded brand color values duplicated outside token file

**File:** `src/compositions/scenes/BrandElementsScene.tsx:60,73`
**Issue:** Lines 60 and 73 hardcode `'#EDE8E3'` and `'#8B2635'` as raw string literals instead of using `BRAND.colors.bgBase` and `BRAND.colors.accent` from the imported `tokens.ts`. If the brand colors ever change in tokens.ts, these hardcoded values would become stale and create visual inconsistency. The same file correctly uses `BRAND.colors.accent` on line 85, making the inconsistency clearly unintentional.
**Fix:** Replace the hardcoded values:
```tsx
// Line 60: replace '#EDE8E3' with:
backgroundColor: BRAND.colors.bgBase,

// Line 73: replace '#8B2635' with:
backgroundColor: BRAND.colors.accent,
```

---

_Reviewed: 2026-05-13T02:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
