---
phase: 4
plan: "04-05"
title: "CLI Entry Point, Docker Container & npm Scripts"
subsystem: content-ingestion
tags: [cli, docker, cron, scheduling, cross-platform]
dependency_graph:
  requires: ["04-01", "04-02", "04-03", "04-04"]
  provides: ["ingest-cli", "ingest-container", "npm-scripts"]
  affects: ["docker-compose.yml", "package.json"]
tech_stack:
  added: ["cron (container)"]
  patterns: ["docker-compose service", "CLI mode routing", "cron scheduling"]
key_files:
  created:
    - scripts/ingest.ts
    - docker/Dockerfile.ingest
    - docker/crontab.ingest
  modified:
    - docker-compose.yml
    - package.json
    - .gitignore
decisions:
  - "CLI entry detection uses import.meta.url + process.argv[1] check (ESM-compatible)"
  - "ingest:llm runs on host (needs Claude Code session), all other modes route through docker compose"
  - "Added logs/ to .gitignore since runtime ingest logs are generated artifacts"
metrics:
  duration: "3m 28s"
  completed: "2026-05-14"
  tasks: 3
  files_created: 3
  files_modified: 3
---

# Phase 4 Plan 05: CLI Entry Point, Docker Container & npm Scripts Summary

CLI orchestrator with 4-mode routing (poll/search/scheduled/llm-extract), Docker container with cron for cross-platform weekly scheduling, 5 npm scripts for all ingestion operations.

## What Was Built

### Task 1: Main CLI Entry Point (29aaa41)
Created `scripts/ingest.ts` as the orchestrator that imports and routes through all ingest/* modules:
- `runIngest(mode, config, overrides)` function with 4 mode branches
- `poll`: all enabled vendors through scrape-extract-diff-PR pipeline
- `search`: single vendor filtered by --vendor flag
- `scheduled`: same as poll with log rotation, traditional scraper only (no LLM per Pitfall 6)
- `llm-extract`: generates Claude Code passthrough prompts via writePendingPrompt
- CLI entry point parses --mode, --vendor, --dry-run, --concurrency, --timeout
- Reads vendor source files from content/sources/ via readdirSync

### Task 2: Dockerfile.ingest and Crontab (988c656)
- `docker/Dockerfile.ingest`: node:22-bookworm-slim base, installs cron + git, copies scripts/content/config, sets up crontab, CMD starts cron daemon + tails log
- `docker/crontab.ingest`: weekly schedule (Monday 6am UTC), runs `--mode scheduled`

### Task 3: Docker Compose Service and npm Scripts (8a4d9fc)
- Added `ingest` service to docker-compose.yml with volume mounts for content, scripts, config, logs
- 5 npm scripts registered in package.json:
  - `ingest:poll` - docker compose run (all vendors)
  - `ingest:search` - docker compose run (single vendor)
  - `ingest:schedule` - docker compose up -d (start cron container)
  - `ingest:unschedule` - docker compose stop (stop cron container)
  - `ingest:llm` - host-side execution (Claude Code passthrough)
- Added `logs/` to .gitignore

## Verification Results

- Dry-run smoke test: `npx tsx scripts/ingest.ts --mode search --vendor anthropic --dry-run` exits 0 (10/10 sources scraped successfully)
- Full test suite: 211 tests passing across 13 test files
- TRAN-01 deferred: no transcription files in scripts/
- Cross-platform: no schtasks or Windows-specific commands
- All 5 npm scripts verified present in package.json

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. CLI entry detection uses `import.meta.url` + `process.argv[1]` pattern for ESM module compatibility (consistent with tsx execution)
2. `ingest:llm` runs on host because it needs the active Claude Code session for passthrough; all other modes run containerized
3. Added `logs/` to .gitignore since the dry-run smoke test generates runtime log files (JSONL format, not covered by existing `*.log` pattern)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 04-05-01 | 29aaa41 | CLI entry point with mode routing |
| 04-05-02 | 988c656 | Dockerfile.ingest and crontab |
| 04-05-03 | 8a4d9fc | Docker compose service and npm scripts |

## Self-Check: PASSED

All 3 files verified on disk. All 3 commit hashes found in git log.
