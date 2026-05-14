---
phase: 03-content-repository-schemas
plan: 05
subsystem: content
tags: [zod, validation, scene-mapping, cli, vitest, integration-tests]

# Dependency graph
requires:
  - phase: 03-content-repository-schemas (plans 01-04)
    provides: schemas, tool JSON files, source JSON files, lesson schemas, scene-type definitions
provides:
  - Content-to-scene mapping for change-triggered re-rendering identification
  - Validation CLI for all content files against Zod schemas
  - Integration test suite proving entire content repository valid end-to-end
affects: [04-render-pipeline, animation-system, content-updates]

# Tech tracking
tech-stack:
  added: []
  patterns: [content-scene-mapping, prefix-path-matching, cli-validation-with-ansi, cross-reference-validation]

key-files:
  created:
    - content/mappings/scene-content-map.ts
    - scripts/validate-content.ts
    - test/content-validation.test.ts
  modified:
    - package.json

key-decisions:
  - "Used prefix matching with wildcard support for content path mapping (capabilities.* matches any sub-path)"
  - "Validation CLI uses safeParse for non-throwing schema checks with structured error reporting"

patterns-established:
  - "Content-scene mapping: content paths map to affected scene types via CONTENT_SCENE_MAPPINGS array"
  - "Prefix path matching: wildcard (capabilities.*), exact match, and prefix match (capabilities matches capabilities.X)"
  - "CLI validation pattern: read all files, validate against schemas, cross-reference, print ANSI results, exit code 0/1"

requirements-completed: [CONT-04, CONT-05]

# Metrics
duration: 2min
completed: 2026-05-14
---

# Phase 3 Plan 5: Content-to-Scene Mapping and Validation Summary

**Content-to-scene mapping with prefix matching, validation CLI for 12 tools and 11 sources, and 56 integration tests proving repository integrity**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-14T13:03:58Z
- **Completed:** 2026-05-14T13:06:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Content-to-scene mapping enables "tool X capability changed -> these scenes need re-rendering" (CONT-04)
- Validation CLI validates all 12 tool files and 11 source files against Zod schemas with cross-reference checks (CONT-05)
- 56 integration tests cover schema validation (12 tools x 2 checks + 11 sources + 12 cross-refs + 8 mapping tests + 1 count check)
- All 12 tools validated with 11 capability categories each; all sourceRefs resolve to existing source IDs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create content-to-scene mapping system** - `3c20ae4` (feat)
2. **Task 2: Create validation CLI and integration tests** - `5e15f18` (feat)

## Files Created/Modified
- `content/mappings/scene-content-map.ts` - Content-to-scene mapping with getAffectedScenes and getToolsAffectingScene exports
- `scripts/validate-content.ts` - CLI script validating all tool/source JSON against schemas with cross-reference checks
- `test/content-validation.test.ts` - 56 integration tests for schemas, cross-references, and mapping functions
- `package.json` - Added validate:content npm script

## Decisions Made
- Used prefix matching with wildcard support (capabilities.* pattern) rather than regex for content path matching -- simpler and more readable
- Validation CLI uses Zod safeParse for non-throwing validation with structured error output per file

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Content repository is fully validated end-to-end: 12 tools, 11 sources, all cross-references intact
- Content-to-scene mapping ready for render pipeline to use for incremental re-rendering
- Phase 3 content repository and schemas complete -- ready for Phase 4 render pipeline

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commits (3c20ae4, 5e15f18) found in git log
- validate:content npm script present in package.json
- 56/56 vitest tests pass
- Validation CLI exits with code 0 (35/35 checks pass)
- tsc --noEmit clean

---
*Phase: 03-content-repository-schemas*
*Completed: 2026-05-14*
