---
phase: 04-content-ingestion-freshness
plan: "04-03"
subsystem: ingest
tags: [diff, schema-validation, zod, content-freshness]

requires:
  - phase: 03-content-repository-schemas
    provides: ToolSchema, SourceFileSchema from content/schemas/
provides:
  - diffToolData() compares scraped data against existing tool JSON
  - applyDiff() validates merged data via ToolSchema.safeParse before write
  - unmappedData captures schema-drift fields (D-07 best-effort)
  - Configurable basePath for test isolation

self_check: PASSED
key-files:
  created:
    - scripts/ingest/differ.ts
    - test/differ.test.ts
    - test/ingest-validation.test.ts
---

## Summary

Built the diff engine that compares scraped data against existing tool JSON files, detects changed fields, and captures unmapped data for schema drift (D-07). All writes validated through ToolSchema.safeParse before commit. basePath parameter makes tool file location configurable for testing with temp directories.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| 04-03-01 | Create diff engine with configurable basePath | Done |
| 04-03-02 | Create diff engine unit tests | Done |
| 04-03-03 | Create ingestion validation tests | Done |

## Test Results

17 tests passing across 2 test files:
- `test/differ.test.ts`: 10 tests (diffToolData, applyDiff, getToolFilePath)
- `test/ingest-validation.test.ts`: 7 tests (ToolSchema, SourceFileSchema validation)

## Deviations

None — plan executed as written.
