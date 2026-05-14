---
phase: 4
slug: content-ingestion-freshness
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.6 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-xx-01 | 01 | 1 | CONT-06-a | — | N/A | unit | `npx vitest run test/ingest-config.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-02 | 01 | 1 | CONT-06-b | T-04-01 | Scraped HTML content never injected as raw HTML into JSON | unit | `npx vitest run test/scraper.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-03 | 01 | 1 | CONT-06-c | T-04-01 | Zod rejects non-conforming scraped data | unit | `npx vitest run test/ingest-validation.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-04 | 01 | 1 | CONT-06-d | — | N/A | unit | `npx vitest run test/differ.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-05 | 01 | 1 | CONT-06-e | — | N/A | unit | `npx vitest run test/scraper.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-06 | 02 | 2 | CONT-06-f | T-04-02 | Vendor names sanitized before shell commands | integration | `npx vitest run test/pr-workflow.test.ts -x` | ❌ W0 | ⬜ pending |
| 04-xx-07 | 02 | 2 | CONT-06-g | — | N/A | smoke | `npm run ingest:poll -- --vendor anthropic --dry-run` | ❌ W0 | ⬜ pending |
| 04-xx-08 | 02 | 2 | CONT-06-h | — | N/A | manual-only | Manual: run `npm run ingest:schedule` and verify in Task Scheduler | N/A | ⬜ pending |
| 04-xx-09 | 01 | 1 | CONT-06-i | — | N/A | unit | `npx vitest run test/scraper.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/ingest-config.test.ts` — config loading, validation, CLI override merge
- [ ] `test/scraper.test.ts` — HTTP scraping, cheerio extraction, robots.txt, error handling
- [ ] `test/differ.test.ts` — diff detection between scraped and existing data
- [ ] `test/ingest-validation.test.ts` — scraped data against ToolSchema/SourceFileSchema
- [ ] `test/pr-workflow.test.ts` — git branch creation, PR creation (mock gh CLI)
- [ ] Install dependencies: `npm install cheerio robots-parser p-limit`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Windows Task Scheduler setup/removal | CONT-06-h | schtasks modifies OS state, not safely automatable in tests | Run `npm run ingest:schedule`, verify task appears in Task Scheduler GUI, then `npm run ingest:unschedule` to clean up |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
