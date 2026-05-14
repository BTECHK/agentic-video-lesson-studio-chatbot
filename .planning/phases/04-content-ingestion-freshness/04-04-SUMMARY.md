---
phase: 04-content-ingestion-freshness
plan: "04-04"
subsystem: infra
tags: [git, github-pr, cli, llm-extraction, command-injection-prevention]

# Dependency graph
requires:
  - phase: 04-01
    provides: IngestConfig type and config loader
  - phase: 04-02
    provides: ScrapeResult type, scraper module
  - phase: 04-03
    provides: DiffResult type, differ module
provides:
  - Per-vendor PR workflow with git remote validation and command injection prevention
  - LLM extraction prompt generator for Claude Code passthrough
  - PR workflow test suite (17 tests)
affects: [04-05-cli-scheduler]

# Tech tracking
tech-stack:
  added: []
  patterns: [execSync-mock-pattern, shell-metachar-sanitization, dryRun-skip-pattern]

key-files:
  created:
    - scripts/ingest/pr-workflow.ts
    - scripts/ingest/llm-extract.ts
    - test/pr-workflow.test.ts
  modified: []

key-decisions:
  - "Vendor name validation is two-layer: metacharacter rejection plus lowercase-alphanumeric-hyphen allowlist"
  - "checkGitRemote returns { configured: false } gracefully; createVendorPR throws with setup instructions"
  - "LLM extraction is prompt-only (no API calls) per D-02 — Claude Code passthrough design"

patterns-established:
  - "execSync mock pattern: vi.mock('node:child_process') with call-count-based return values"
  - "Shell injection prevention: SHELL_METACHAR_PATTERN + allowlist regex on all user-facing string inputs to shell commands"

requirements-completed: [CONT-06]

# Metrics
duration: 4min
completed: 2026-05-14
---

# Phase 4 Plan 04-04: PR Workflow & LLM Extraction Summary

**Per-vendor git PR workflow with command injection prevention and LLM extraction prompt generator for Claude Code passthrough**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-14T20:33:43Z
- **Completed:** 2026-05-14T20:37:33Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- PR workflow with sanitizeVendorName (T-04-02), checkGitRemote, checkExistingPR (Pitfall 3), createVendorPR with dryRun support
- LLM extraction module: generateExtractionPrompt, parseExtractionResponse, writePendingPrompt -- no direct API calls
- 17 test cases covering command injection prevention, remote validation, PR deduplication, dryRun mode, and full PR creation flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PR workflow with git remote validation** - `d855263` (feat)
2. **Task 2: Create LLM-assisted extraction module** - `181d506` (feat)
3. **Task 3: Create PR workflow tests** - `e72f4b8` (test)

## Files Created/Modified
- `scripts/ingest/pr-workflow.ts` - Per-vendor PR workflow: sanitize, remote check, existing PR check, branch/commit/push/PR
- `scripts/ingest/llm-extract.ts` - Prompt generator for Claude Code passthrough, response parser, pending prompt writer
- `test/pr-workflow.test.ts` - 17 tests with mocked execSync covering all PR workflow functions

## Decisions Made
- Vendor name validation uses two-layer defense: metacharacter pattern rejection plus strict lowercase-alphanumeric-hyphen allowlist regex
- checkGitRemote returns gracefully (not throws); createVendorPR is the function that throws with setup instructions when no remote
- parseExtractionResponse tries fenced JSON blocks first, then raw JSON parse as fallback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PR workflow and LLM extraction modules ready for consumption by 04-05 CLI entry point
- createVendorPR exported for CLI integration
- generateExtractionPrompt exported for manual pull mode
- 211 total tests passing across 13 test files

## Self-Check: PASSED

All 3 created files verified on disk. All 3 task commit hashes found in git log.

---
*Phase: 04-content-ingestion-freshness*
*Completed: 2026-05-14*
