# Phase 4: Content Ingestion & Freshness - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated systems that keep the content repository current. Two subsystems: (1) web scraping that discovers and ingests AI tool updates from vendor docs, changelogs, and support pages, and (2) CLI/scheduling infrastructure for the three ingestion modes (manual poll, specific search, scheduled poll). This phase populates and refreshes the content created in Phase 3 — it does NOT define schemas (Phase 3), build the chatbot (Phase 5), or create animations (Phase 2).

**Note:** Video transcription (TRAN-01) is being handled separately outside this phase's scope. The transcription pipeline will be addressed as a standalone update later.

</domain>

<decisions>
## Implementation Decisions

### Scraping Strategy
- **D-01:** Two scraping methods mapped to ingestion modes. LLM-assisted extraction for manual/interactive pulls (user is present, Claude Code passthrough for extraction). Traditional HTTP scraping for scheduled/async jobs (runs unattended, lower cost, no LLM dependency).
- **D-02:** Claude Code passthrough is the LLM backend for manual pulls — no additional API key needed. Routes extraction through the running Claude Code session.
- **D-03:** Configurable scrape targets per vendor. Each source entry in the vendor's source file gets a scrape priority/flag. Some URLs are actively scraped (changelogs, release notes, "what's new"), others are reference-only (API docs, checked only on manual pull).
- **D-04:** Failure strategy is skip-and-log. When a vendor page can't be scraped (anti-bot, JS-heavy SPA, CAPTCHA), log the failure and move on. User can do a targeted manual LLM-assisted pull for that vendor later. Scheduled jobs stay simple and non-blocking.

### Content Update Flow
- **D-05:** Git branch + GitHub PR per vendor. Each update run creates a branch with changes for a single vendor. A GitHub PR is opened for review. PRs accumulate until the user reviews — fully async-compatible.
- **D-06:** One PR per vendor that changed (not one combined PR per run). Easier to review, can approve vendors independently. PR title/body should summarize what changed.
- **D-07:** Best-effort mapping for schema drift. When scraped content doesn't perfectly fit the existing Zod schemas, the system tries to map new data into existing fields. Anything that doesn't fit gets logged as unstructured notes in the tool file. Schema changes are manual — user decides when to evolve the schema.

### Scheduling & CLI
- **D-08:** npm scripts as the CLI interface (consistent with existing project patterns: npm run render, npm run validate). Three commands mapping to the three modes: manual poll, specific search, scheduled poll.
- **D-09:** Dual interface — JSON config file (ingest.config.json) as primary configuration + CLI flags as overrides for one-off runs. Config file is the human-readable persistent interface; flags are the programmatic/quick interface.
- **D-10:** Per-vendor settings in ingest.config.json: which URLs to scrape, polling frequency, enabled/disabled per vendor. CLI flags can override any config value for a single run.
- **D-11:** OS-level scheduler (Windows Task Scheduler) for scheduled polling. Runs independently of any terminal session — robust for unattended operation.
- **D-12:** Three ingestion modes are first-class features (from prior memory):
  - Manual poll: on-demand content refresh triggered by user
  - Specific search: targeted search for updates on specific tools/companies
  - Scheduled poll: automatic periodic checks via OS scheduler
- **D-13:** Company-scoped parameters: can target a specific vendor, a list of vendors, or all vendors. Configurable granularity in both config file and CLI flags.

### Claude's Discretion
- Source file extension vs separate config: Whether to extend existing source files (content/sources/*.json) with scraping metadata or keep scraping config entirely in ingest.config.json. Pick what minimizes schema churn and keeps things maintainable.
- Traditional scraper implementation details (HTTP library, HTML parsing approach, rate limiting)
- PR template format and branch naming conventions
- Logging format and storage location for scraping results/failures
- Internal architecture of the ingestion pipeline (module structure, error handling patterns)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Repository (Data Target)
- `.planning/phases/03-content-repository-schemas/03-CONTEXT.md` — Phase 3 decisions on content structure: one JSON per tool, per-vendor source bibliography, git-based freshness tracking (D-05, D-06, D-07 directly inform scraper design)
- `content/schemas/tool.ts` — ToolSchema with Zod validation: id, name, vendor, priority, capabilities record, sourceRefs
- `content/schemas/source.ts` — SourceEntrySchema and SourceFileSchema: id, url, title per source entry
- `content/schemas/capabilities.ts` — CapabilityCategorySchema: the 11 fixed capability categories

### Existing Content (Scrape Targets)
- `content/sources/*.json` — 11 vendor source bibliography files with URLs to scrape (openai, anthropic, google, perplexity, xai, deepseek, alibaba, comet, manus, openai-codex, anthropic-code)
- `content/tools/*.json` — 12 tool data files that scrapers will update

### Project Context
- `.planning/REQUIREMENTS.md` — CONT-06 defines the web scraping requirement; TRAN-01 is deferred
- `.planning/ROADMAP.md` — Phase 4 success criteria (2 items), dependency on Phase 3

### Research
- `.planning/research/PITFALLS.md` (Pitfall 10) — Large video transcription chunking strategy (reference for future TRAN-01 work)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `content/schemas/tool.ts`: ToolSchema with full Zod validation — scrapers must produce data conforming to this schema
- `content/schemas/source.ts`: SourceFileSchema — scraping config may extend or reference these source entries
- `content/sources/*.json`: 11 vendor source files with URLs already cataloged — these are the scrape target URLs
- `content/tools/*.json`: 12 tool data files with the structure scrapers need to update

### Established Patterns
- TypeScript with Zod validation throughout
- One JSON file per tool, one source file per vendor
- Git-based freshness tracking (no verifiedAt fields — git log is source of truth)
- npm scripts for CLI commands (render, validate)

### Integration Points
- Scrapers update `content/tools/*.json` and `content/sources/*.json` — must pass existing Zod validation
- Source file IDs (e.g., "openai-models") are referenced by tool files via `sourceRefs` — new sources must maintain this linkage
- Phase 5 chatbot RAGs against the same content files — scraper updates flow through to chatbot answers
- Phase 3's validation CLI (`npm run validate`) should validate scraper output before committing

</code_context>

<specifics>
## Specific Ideas

- Claude Code is the primary development and operational tool — CLI exists for best practice but user will invoke through Claude Code
- The dual-method scraping (LLM for manual, traditional for scheduled) keeps costs down while maintaining quality for interactive use
- Per-vendor PRs create a natural review workflow — user can approve OpenAI updates without reviewing all 11 vendors
- The system should work with the content repository as-is (Phase 3 complete) — no schema migrations needed for basic ingestion

</specifics>

<deferred>
## Deferred Ideas

- **TRAN-01 (Video Transcription):** User is handling transcription separately. The pipeline for processing large video files will be addressed as a standalone update, not part of this phase's implementation.
- **FRESH-01/02/03 (Content Freshness Automation):** Automated change detection, human-in-the-loop approval workflow, and change-triggered re-rendering are v2 requirements. Phase 4 builds the foundation (scraping + PRs) that these can layer onto.

</deferred>

---

*Phase: 04-content-ingestion-freshness*
*Context gathered: 2026-05-14*
