---
phase: 04-content-ingestion-freshness
plan: "04-03"
subsystem: ingestion
tags: [zod, diff-engine, schema-validation, content-freshness]

requires:
  - phase: 03-content-repository-schemas
    provides: ToolSchema, SourceFileSchema, content/tools/*.json
  - phase: 04-content-ingestion-freshness
    provides: ingest config loader (04-01), scraper + extractor (04-02)
provides:
  - diffToolData function comparing scraped data against existing tool JSON
  - applyDiff function with ToolSchema.safeParse validation before write
  - unmappedData capture for schema drift (D-07)
  - Ingestion validation test suite for scraped data conformance
affects: [04-04-pr-workflow, 04-05-cli-scheduler]

tech-stack:
  added: []
  patterns: [basePath parameter for test isolation, temp directory test pattern]

key-files:
  created:
    - scripts/ingest/differ.ts
    - test/differ.test.ts
    - test/ingest-validation.test.ts
  modified: []

key-decisions:
  - "basePath parameter defaults to content/tools/ via import.meta.dirname but is overridable for test isolation"
  - "unmapped keys are captured in DiffResult but excluded from applyDiff writes to prevent tool file pollution"
  - "applyDiff merges existing + scraped (scraped overwrites known fields only) then validates the merged result"

patterns-established:
  - "Temp directory basePath pattern: mkdtempSync + basePath for testing file-writing code without touching real content"
  - "Schema-gated writes: ToolSchema.safeParse must pass before any file write (T-04-01 mitigation)"

requirements-completed: [CONT-06]

duration: 2min
completed: 2026-05-14
---

# Phase 4 Plan 03: Diff Engine & Schema Validation Summary

**Diff engine comparing scraped data against tool JSON with ToolSchema.safeParse gating all writes and D-07 unmapped data capture**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-14T20:30:12Z
- **Completed:** 2026-05-14T20:32:23Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Diff engine (differ.ts) that compares scraped data against existing tool JSON, detecting changed fields and capturing unknown keys as unmappedData (D-07 best-effort)
- applyDiff validates merged data with ToolSchema.safeParse before writing (T-04-01 tampering mitigation)
- 17 passing tests across two test suites covering diff detection, validation rejection, dryRun, and schema conformance

## Task Commits

Each task was committed atomically:

1. **Task 1: Create diff engine with configurable basePath** - `788d8bf` (feat)
2. **Task 2: Create diff engine unit tests** - `d8afe41` (test)
3. **Task 3: Create ingestion validation tests** - `9a803eb` (test)

## Files Created/Modified
- `scripts/ingest/differ.ts` - Diff engine: diffToolData, applyDiff, getToolFilePath with basePath
- `test/differ.test.ts` - 10 unit tests for diff engine using temp directories
- `test/ingest-validation.test.ts` - 7 validation tests for scraped data against ToolSchema and SourceFileSchema

## Decisions Made
- basePath parameter defaults to content/tools/ via import.meta.dirname but is overridable for test isolation
- Unmapped keys captured in DiffResult.unmappedData but excluded from applyDiff merges to prevent polluting tool files with unstructured data
- applyDiff merges existing data with scraped data (scraped overwrites known fields only), then validates the full merged result

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 1 complete (04-01 config, 04-02 scraper, 04-03 differ all done)
- Ready for Wave 2: 04-04 (PR workflow) and 04-05 (CLI + scheduler)
- differ.ts exports diffToolData/applyDiff ready for CLI entry point consumption

## Self-Check: PASSED

All 3 files verified on disk. All 3 commit hashes found in git log.
