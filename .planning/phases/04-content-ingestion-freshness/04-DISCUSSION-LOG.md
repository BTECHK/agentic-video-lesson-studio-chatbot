# Phase 4: Content Ingestion & Freshness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 04-content-ingestion-freshness
**Areas discussed:** Scraping strategy, Content update flow, Scheduling & CLI
**Skipped:** Transcription pipeline (user handling separately)

---

## Scraping Strategy

### Extraction Method

| Option | Description | Selected |
|--------|-------------|----------|
| LLM-assisted | Fetch pages, pass to Claude API for structured extraction. Handles diverse formats. | |
| Traditional scraping | Per-vendor scrapers with CSS selectors. More brittle, no LLM costs. | |
| Hybrid | Traditional fetch + LLM extraction combined. | |

**User's choice:** Multiple methods mapped to modes — LLM-assisted for manual/interactive pulls, traditional scraping for scheduled/async jobs. Not a hybrid per-pull, but different methods for different modes.
**Notes:** "We need multiple modes... It's not using two methods for one pull. It's more like we have multiple methods of pulling."

### Scrape Targets

| Option | Description | Selected |
|--------|-------------|----------|
| Changelogs & release notes | Focus on pages that announce changes. | |
| All listed sources | Scrape every URL in vendor source file. | |
| Configurable per vendor | Each source entry gets a scrape flag/priority. | ✓ |

**User's choice:** Configurable per vendor

### Failure Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Skip and log | Log failure, move on. User does manual pull later. | ✓ |
| Headless browser fallback | Try Playwright if HTTP fails. Handles JS pages. | |
| You decide | Claude picks the right strategy. | |

**User's choice:** Skip and log

### LLM Backend

| Option | Description | Selected |
|--------|-------------|----------|
| Claude API directly | Call Anthropic API with extraction prompt. Needs API key. | |
| Claude Code passthrough | Route through Claude Code. No extra API key needed. | ✓ |
| You decide | Claude picks based on simplicity and cost. | |

**User's choice:** Claude Code passthrough

---

## Content Update Flow

### Update Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Direct commit | Scraper validates and commits directly. | |
| Staged review | Writes to staging area for manual approval. | |
| Git branch + PR | Creates branch + PR for review. | ✓ |

**User's choice:** Git branch + GitHub PR. User considered hybrid between direct commit and PR but leaned toward PR for reviewability.
**Notes:** "I don't think that we'll want to review everything manually all the time... Leaning towards git branch plus PR."

### Review Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub PR | Creates PR per update. Reviewable on GitHub. | ✓ |
| Local branch + CLI | Local branch with CLI summary. No GitHub dependency. | |
| You decide | Claude picks the review mechanism. | |

**User's choice:** GitHub PR

### PR Scope

| Option | Description | Selected |
|--------|-------------|----------|
| One PR per vendor | Easier to review, approve independently. | ✓ |
| One combined PR per run | Less noise, one PR for all vendor changes. | |
| You decide | Claude picks based on review flow. | |

**User's choice:** One PR per vendor

### Schema Drift

| Option | Description | Selected |
|--------|-------------|----------|
| Log and skip | Record unmapped data, skip it. Schema changes are manual. | |
| Best-effort mapping | Try to fit new data into existing fields. Log overflow. | ✓ |
| You decide | Claude picks safest approach. | |

**User's choice:** Best-effort mapping

---

## Scheduling & CLI

### Interface

| Option | Description | Selected |
|--------|-------------|----------|
| npm scripts / CLI commands | Consistent with existing project patterns. | ✓ |
| Standalone CLI tool | Dedicated binary with subcommands. | |
| You decide | Claude picks what fits project structure. | |

**User's choice:** npm scripts (best practice), but Claude Code is the primary invocation method.
**Notes:** "I don't think the advantage of us developing a CLI mostly will be utilizing Claude Code to run everything but it just is best practice."

### Scheduler

| Option | Description | Selected |
|--------|-------------|----------|
| Node cron (in-process) | Long-running process with node-cron. Stops when terminal closes. | |
| OS-level scheduler | Windows Task Scheduler. Runs independently. | ✓ |
| Manual only for now | Skip scheduler for v1. | |

**User's choice:** OS-level scheduler (Windows Task Scheduler)

### Config Format

| Option | Description | Selected |
|--------|-------------|----------|
| JSON config file | ingest.config.json with per-vendor settings. CLI flags override. | ✓ |
| CLI flags only | Everything via flags. No config file. | |
| You decide | Claude picks best fit. | |

**User's choice:** Both — JSON config file as primary + CLI flags as overrides. "There should be kind of the computer interface and then there should be the easy human-readable interface."

### Source File Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Extend source files | Add scrape fields to source entries. | |
| Separate config | Scraping config in ingest.config.json, references source IDs. | |
| You decide | Claude picks what minimizes schema churn. | ✓ |

**User's choice:** You decide — "whatever is best for you"

---

## Claude's Discretion

- Source file extension vs separate scraping config (D-discretion)
- Traditional scraper implementation details (HTTP library, parsing, rate limiting)
- PR template format and branch naming conventions
- Logging format and storage
- Internal pipeline architecture

## Deferred Ideas

- TRAN-01 (Video Transcription) — user handling separately, not part of this phase
- FRESH-01/02/03 (Content Freshness Automation) — v2 requirements, Phase 4 builds the foundation
