---
phase: 01-rendering-environment
plan: 03
subsystem: infra
tags: [validation, ffprobe, sharp, tdd, vitest, mp4-validation]

# Dependency graph
requires:
  - phase: 01-01
    provides: Remotion v4 scaffold, Docker infra, sharp/vitest dependencies
provides:
  - Post-render validation pipeline (scripts/verify.ts)
  - TDD tests for all validation checks (test/validation.test.ts)
  - validateRender() orchestrator producing JSON report at output/validation/report.json
  - Individual validators: file size, resolution, fps, duration, blank frames, font rendering
affects: [01-04-PLAN, phase-2]

# Tech tracking
tech-stack:
  added: []
  patterns: [ffprobe-json-parsing, sharp-pixel-analysis, shell-path-sanitization]

key-files:
  created:
    - scripts/verify.ts
    - test/validation.test.ts
  modified: []

key-decisions:
  - "Individual validators accept parsed values (not file paths) for testability without ffprobe"
  - "Shell metacharacter sanitization on file paths before execSync (T-01-06 threat mitigation)"

patterns-established:
  - "Validation functions: pure functions accepting parsed data, returning CheckResult { passed, ...details }"
  - "Image analysis: sharp raw pixel buffer for blank detection (>98% same color) and font verification (stddev > 25)"
  - "CLI entry: require.main === module guard for script/test dual-use"

requirements-completed: [INFRA-06, VERI-04]

# Metrics
duration: 4min
completed: 2026-05-13
---

# Phase 1 Plan 03: Post-Render Validation Pipeline Summary

**TDD-built validation pipeline checking MP4 file size (<1.8GB), resolution (1920x1080), fps (30), duration accuracy, blank frame detection, and font rendering verification via ffprobe and sharp**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-13T18:07:45Z
- **Completed:** 2026-05-13T18:11:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 18 test cases covering all 6 validation areas written before implementation (TDD RED)
- Validation pipeline implemented with all tests passing (TDD GREEN)
- Path sanitization for execSync prevents shell injection (T-01-06 threat mitigation)
- CLI entry point exits 0/1 for pipeline integration

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Failing tests for validation pipeline** - `217b2b7` (test)
2. **Task 2: GREEN -- Implement validation pipeline** - `6f31296` (feat)

## Files Created/Modified
- `test/validation.test.ts` - 18 test cases: file size, resolution, fps, duration, blank frames, font rendering
- `scripts/verify.ts` - Validation pipeline: extractMetadata (ffprobe), individual validators, image analysis (sharp), validateRender orchestrator, CLI entry

## Decisions Made
- **Individual validators accept parsed values:** validateFileSize(bytes), validateResolution(w,h), validateFps(fps), validateDuration(actual,expected) take simple values rather than file paths. This makes them testable without ffprobe or actual MP4 files. The extractMetadata function handles ffprobe interaction separately.
- **Shell metacharacter sanitization:** File paths passed to execSync are checked for ; | & $ backtick characters and rejected before shell execution (T-01-06 mitigation).

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

- RED gate: `217b2b7` (test commit -- 18 tests fail because scripts/verify.ts does not exist)
- GREEN gate: `6f31296` (feat commit -- all 18 tests pass)
- REFACTOR gate: Not needed -- code is clean and minimal

## Issues Encountered
None -- plan executed smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Validation pipeline ready for integration with render script (Plan 04 pipeline orchestrator)
- validateRender() can be called after renderMedia() completes
- JSON report written to output/validation/report.json for HTML gallery display
- CLI mode available for Docker container usage: `node scripts/verify.js <mp4> <screenshots-dir> <duration>`

---
*Phase: 01-rendering-environment*
*Completed: 2026-05-13*
