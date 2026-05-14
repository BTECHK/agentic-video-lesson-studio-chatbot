# Phase 4: Content Ingestion & Freshness - Research

**Researched:** 2026-05-14
**Domain:** Web scraping, CLI tooling, OS scheduling, git-based content update workflow
**Confidence:** HIGH

## Summary

Phase 4 builds a web scraping system that keeps the Phase 3 content repository current. The system has two scraping methods (LLM-assisted for manual pulls, traditional HTTP for scheduled jobs), three ingestion modes (manual poll, specific search, scheduled poll), and a per-vendor GitHub PR workflow for review. TRAN-01 (video transcription) is explicitly deferred.

The technical challenge is moderate. The scraping targets are vendor documentation pages -- primarily server-rendered HTML that cheerio can parse directly. Some vendors (OpenAI platform docs) return 403 to simple HTTP requests, validating the dual-method strategy where the LLM-assisted path handles difficult pages and the traditional scraper skips-and-logs failures. The project already has Zod schemas, validation tooling, and content files in place -- the scraper's job is to produce data conforming to existing schemas.

**Primary recommendation:** Use native Node.js `fetch` (available in Node 24) + cheerio for traditional scraping, with Zod for output validation against existing schemas. Keep the architecture simple: one scraper module per vendor is unnecessary -- use a generic scraper with per-vendor configuration. The git branch + PR workflow uses the `gh` CLI directly (already authenticated).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Two scraping methods: LLM-assisted extraction for manual/interactive pulls (Claude Code passthrough), traditional HTTP for scheduled/async jobs
- **D-02:** Claude Code passthrough is the LLM backend for manual pulls -- no additional API key needed
- **D-03:** Configurable scrape targets per vendor with priority/flag per source URL
- **D-04:** Failure strategy is skip-and-log. Non-blocking. User does manual LLM pull for failures later
- **D-05:** Git branch + GitHub PR per vendor for content updates
- **D-06:** One PR per vendor that changed (not combined). PR title/body summarizes changes
- **D-07:** Best-effort mapping for schema drift. Unmapped data goes to unstructured notes. Manual schema evolution
- **D-08:** npm scripts as CLI interface (manual poll, specific search, scheduled poll)
- **D-09:** Dual interface: JSON config file (ingest.config.json) + CLI flags as overrides
- **D-10:** Per-vendor settings in ingest.config.json: URLs, polling frequency, enabled/disabled
- **D-11:** OS-level scheduler (Windows Task Scheduler) for scheduled polling
- **D-12:** Three ingestion modes are first-class features (manual poll, specific search, scheduled poll)
- **D-13:** Company-scoped parameters: target specific vendor, list of vendors, or all vendors

### Claude's Discretion
- Source file extension vs separate config: Whether to extend existing source files with scraping metadata or keep scraping config in ingest.config.json
- Traditional scraper implementation details (HTTP library, HTML parsing, rate limiting)
- PR template format and branch naming conventions
- Logging format and storage location
- Internal architecture of the ingestion pipeline (module structure, error handling patterns)

### Deferred Ideas (OUT OF SCOPE)
- **TRAN-01 (Video Transcription):** User handling separately. Not part of this phase.
- **FRESH-01/02/03 (Content Freshness Automation):** v2 requirements. Phase 4 builds the foundation they layer onto.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-06 | Web scraping/research system that periodically discovers new AI tool developments and updates from vendor docs, changelogs, and support pages -- minimal API key usage, agent-driven | Full stack researched: cheerio + native fetch for traditional scraping, Claude Code passthrough for LLM-assisted mode, ingest.config.json for per-vendor configuration, schtasks for scheduling, gh CLI for PR workflow |
| TRAN-01 | Video transcription pipeline | **DEFERRED** -- user handling separately, not part of this phase |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP scraping | CLI / Node.js scripts | -- | Runs as local CLI commands, no server needed |
| HTML parsing & extraction | CLI / Node.js scripts | -- | cheerio operates in-process, no browser needed for most vendor docs |
| LLM-assisted extraction | Claude Code session | -- | Routes through active Claude Code session (D-02), no API backend |
| Content validation | CLI / Node.js scripts | -- | Existing Zod schemas + validate-content.ts |
| Git branch/PR workflow | CLI / gh tool | GitHub API | gh CLI creates branches and PRs; GitHub hosts the review |
| Scheduling | OS-level (Windows Task Scheduler) | -- | schtasks runs independently of terminal sessions (D-11) |
| Configuration | Filesystem (JSON) | CLI flags | ingest.config.json is primary, flags override (D-09) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | 1.2.0 | HTML parsing and structured data extraction | [VERIFIED: npm registry] Industry standard for server-side HTML parsing, jQuery-like API, fast, no browser needed. Has `$.extract()` for structured data extraction |
| zod | 4.3.6 | Output validation against existing tool/source schemas | [VERIFIED: installed in project] Already used throughout project for content validation |
| Node.js native fetch | Built-in (Node 24) | HTTP requests for scraping | [VERIFIED: Node 24.13.0 installed, fetch confirmed available] Zero dependencies, built-in retry/timeout support |
| gh CLI | 2.86.0 | Creating git branches and GitHub PRs programmatically | [VERIFIED: installed, authenticated as the repo owner] Already configured with repo/workflow scopes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| robots-parser | 3.0.1 | Parse and respect robots.txt before scraping | [VERIFIED: npm registry] Check before each scrape to ensure compliance. Zero dependencies |
| p-limit | 7.3.0 | Concurrency control for parallel vendor scraping | [VERIFIED: npm registry] Limit concurrent HTTP requests to avoid rate limiting. Lightweight |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch | axios 1.16.1 | Axios adds unnecessary dependency -- Node 24 fetch has all needed features (headers, timeout, redirect following) |
| cheerio | @mozilla/readability 0.6.0 | Readability extracts article content but lacks CSS selector precision needed for structured data extraction from vendor docs |
| cheerio | node-html-parser 7.1.0 | Faster parsing but lacks cheerio's `$.extract()` API and jQuery-like traversal convenience |
| p-limit | p-queue 9.2.0 | p-queue is more powerful (priority queues, rate limiting) but overkill for simple concurrency limiting |

**Discretion recommendation (source file extension vs separate config):** Keep scraping config in `ingest.config.json` as a separate file. Reasons:
1. Existing `content/sources/*.json` files conform to `SourceFileSchema` (validated by existing tests) -- adding scraping metadata would require schema changes
2. Separation of concerns: source bibliography (what exists) vs scraping config (how to fetch it)
3. ingest.config.json can reference source IDs without coupling schemas

**Installation:**
```bash
npm install cheerio robots-parser p-limit
```

## Architecture Patterns

### System Architecture Diagram

```
User Invocation
  |
  v
[npm run ingest:*] ─── CLI flags override ──> [Config Loader]
  |                                              |
  |                                        ingest.config.json
  |                                              |
  v                                              v
[Mode Router] ─────────────────────> [Vendor Iterator]
  |                                       |
  |                           ┌───────────┼───────────┐
  |                           v           v           v
  |                      [Vendor A]  [Vendor B]  [Vendor N]
  |                           |           |           |
  v                           v           v           v
[Method Selector] ──> Traditional: fetch + cheerio + extract
  |                           |
  |                   LLM-assisted: Claude Code passthrough
  |                           |
  v                           v
[Schema Validator] ◄── Raw extracted data
  |
  ├── Valid ──> [Diff Engine] ──> changes? ──> [Git Branch] ──> [gh pr create]
  |                                    |
  |                              no changes ──> skip vendor
  |
  └── Invalid ──> [Log + unstructured notes field]
```

### Recommended Project Structure
```
scripts/
├── ingest.ts              # Main entry point, mode router
├── ingest/
│   ├── config.ts          # Config loader (ingest.config.json + CLI flag merge)
│   ├── scraper.ts         # Traditional HTTP scraper (fetch + cheerio)
│   ├── extractor.ts       # Data extraction from parsed HTML (selectors per source type)
│   ├── llm-extract.ts     # LLM-assisted extraction (Claude Code passthrough)
│   ├── differ.ts          # Compare scraped data vs existing tool JSON, produce diff
│   ├── pr-workflow.ts     # Git branch creation, commit, gh pr create
│   ├── scheduler.ts       # Windows Task Scheduler setup/teardown via schtasks
│   └── logger.ts          # Structured logging (JSON lines to file)
├── validate-content.ts    # Existing -- scrapers must pass this
ingest.config.json          # Per-vendor scraping configuration (project root)
```

### Pattern 1: Generic Scraper with Per-Source Selectors
**What:** A single scraper function that takes a URL + extraction config (CSS selectors) and returns structured data. No per-vendor scraper classes.
**When to use:** All traditional (non-LLM) scraping.
**Example:**
```typescript
// Source: cheerio $.extract() API [VERIFIED: Context7 /cheeriojs/cheerio]
import * as cheerio from 'cheerio';

interface ExtractionMap {
  [key: string]: string | string[] | { selector: string; value: string };
}

async function scrapeUrl(url: string, extractionMap: ExtractionMap): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'edu-content-bot/1.0 (+https://github.com/BTECHK/agentic-video-lesson-studio-chatbot)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  return $.extract(extractionMap);
}
```

### Pattern 2: Config-Driven Vendor Iteration
**What:** ingest.config.json defines which vendors to scrape and how. The scraper iterates over enabled vendors, respecting concurrency limits.
**When to use:** All ingestion modes.
**Example:**
```typescript
// ingest.config.json structure
interface IngestConfig {
  vendors: Record<string, VendorConfig>;
  defaults: {
    concurrency: number;
    timeoutMs: number;
    retries: number;
    userAgent: string;
  };
  scheduling: {
    frequency: 'daily' | 'weekly';
    dayOfWeek?: string;
    timeOfDay: string; // HH:mm
  };
}

interface VendorConfig {
  enabled: boolean;
  sources: Record<string, SourceScrapeConfig>;  // keyed by source ID
}

interface SourceScrapeConfig {
  scrapeMode: 'active' | 'reference-only';  // D-03: some URLs are reference-only
  selectors?: ExtractionMap;                  // CSS selectors for traditional scraping
  priority: number;                           // scrape order within vendor
}
```

### Pattern 3: Skip-and-Log Failure Handling
**What:** When a page can't be scraped (403, anti-bot, SPA), log the failure and continue. Never block the run.
**When to use:** All traditional scraping (D-04).
**Example:**
```typescript
interface ScrapeResult {
  sourceId: string;
  url: string;
  status: 'success' | 'skipped' | 'error';
  data?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

// Log to JSON Lines file for easy parsing
function logResult(result: ScrapeResult, logPath: string): void {
  const line = JSON.stringify(result) + '\n';
  appendFileSync(logPath, line);
}
```

### Pattern 4: Per-Vendor PR Workflow
**What:** For each vendor with changes, create a git branch, commit updated files, and open a PR via gh CLI.
**When to use:** After scraping produces validated changes (D-05, D-06).
**Example:**
```typescript
import { execSync } from 'node:child_process';

function createVendorPR(vendor: string, changedFiles: string[]): string {
  const branch = `content/update-${vendor}-${Date.now()}`;
  const baseBranch = 'main';

  execSync(`git checkout -b ${branch} ${baseBranch}`);
  for (const file of changedFiles) {
    execSync(`git add "${file}"`);
  }
  execSync(`git commit -m "content(${vendor}): update tool data from vendor docs"`);
  execSync(`git push -u origin ${branch}`);

  const prUrl = execSync(
    `gh pr create --base ${baseBranch} --title "content(${vendor}): update tool data" --body "Automated content update from vendor documentation scraping."`,
    { encoding: 'utf-8' }
  ).trim();

  execSync(`git checkout ${baseBranch}`);
  return prUrl;
}
```

### Anti-Patterns to Avoid
- **Per-vendor scraper classes:** Don't create `OpenAIScraper`, `AnthropicScraper`, etc. Use a generic scraper with per-source configuration. Vendor-specific logic belongs in selector configs, not code.
- **Headless browser for all scraping:** Don't use Puppeteer/Playwright for the traditional scraping path. Most vendor docs are server-rendered HTML. Reserve browser automation for the LLM-assisted path only if needed in the future.
- **Storing scraping state in the database:** Git is the source of truth (Phase 3 D-06). Don't add a SQLite or other state store. Git log + JSON Lines logs are sufficient.
- **Building a web UI for scraping management:** The CLI + config file is the interface. No dashboards.
- **Modifying existing Zod schemas to accommodate scraper metadata:** Scraping config lives in ingest.config.json, not in the content schemas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Custom regex-based HTML parser | cheerio 1.2.0 | HTML is not regular; regex fails on edge cases, nested tags, malformed markup. cheerio handles all of this |
| robots.txt compliance | Manual parsing of robots.txt format | robots-parser 3.0.1 | robots.txt has subtle rules (wildcards, crawl-delay, sitemaps). Zero-dependency library handles all edge cases |
| Concurrency limiting | Custom Promise.all with batching | p-limit 7.3.0 | Correct concurrent execution with backpressure is tricky to implement. p-limit is 40 lines of battle-tested code |
| GitHub PR creation | Custom GitHub API calls | gh CLI | gh handles authentication, branch creation, push, PR creation with a single command. Already installed and authenticated |
| Task scheduling | Node.js setInterval/cron library | Windows Task Scheduler (schtasks) | OS-level scheduler runs independently of any terminal session, survives reboots, has built-in logging |

**Key insight:** The scraping system is glue code connecting well-solved problems (HTTP fetching, HTML parsing, schema validation, git workflow). Every component has a mature, zero-configuration solution. The only custom logic is the extraction maps (CSS selectors per source type) and the diff engine (comparing scraped data vs existing tool JSON).

## Common Pitfalls

### Pitfall 1: Vendor Pages Block Simple HTTP Requests
**What goes wrong:** Many vendor documentation sites use Cloudflare or similar anti-bot protection. A simple `fetch()` returns 403 Forbidden or a JavaScript challenge page instead of content.
**Why it happens:** Vendors protect their docs with WAFs. OpenAI platform docs (platform.openai.com) returned 403 during research. [VERIFIED: WebFetch test returned 403]
**How to avoid:** This is exactly why D-01 specifies dual-method scraping. The traditional scraper should treat 403/challenge responses as expected failures (skip-and-log per D-04). The user can then use the LLM-assisted path for those vendors. Log which vendors consistently fail so the user knows which need manual pulls.
**Warning signs:** If more than 50% of sources return errors on a scheduled run, the user-agent string or request pattern may need adjustment.

### Pitfall 2: Scraped Data Doesn't Match Existing Schema Shape
**What goes wrong:** Vendor docs restructure, rename features, or add new categories. The scraper extracts data that doesn't fit into the existing ToolSchema's CapabilityEntry structure. Zod validation rejects the update.
**Why it happens:** AI vendor docs change frequently. The 11 fixed capability categories in CapabilityCategorySchema may not perfectly align with how vendors organize their features.
**How to avoid:** D-07 specifies best-effort mapping. Implement a two-pass approach: (1) try to map scraped data into existing schema fields, (2) anything that doesn't fit goes into a separate "unstructured notes" section logged for human review. Never auto-modify the schema.
**Warning signs:** Increasing numbers of "unstructured notes" entries for a vendor indicates the schema may need manual evolution.

### Pitfall 3: Git Branch Conflicts When Multiple Runs Overlap
**What goes wrong:** A scheduled run starts while a previous run's PR is still open. Both runs try to modify the same vendor's tool file. The second run's branch is based on the main branch without the first run's changes, causing a merge conflict.
**Why it happens:** Scheduled polling (D-12) runs on a timer. If the PR from a previous run hasn't been merged, the next run creates a conflicting branch.
**How to avoid:** Before creating a branch for a vendor, check if an open PR already exists for that vendor using `gh pr list --search "content(vendor)"`. If one exists, skip that vendor and log it. This keeps the workflow simple and avoids complex rebase logic.
**Warning signs:** Multiple open PRs for the same vendor.

### Pitfall 4: No Git Remote Configured
**What goes wrong:** The PR workflow (D-05) requires a git remote to push branches and create PRs. Currently, the repository has no remote configured. [VERIFIED: `git config --get remote.origin.url` returned empty, `gh repo view` failed with "no git remotes found"]
**Why it happens:** The project is developed locally without a remote repository.
**How to avoid:** The planner must include a task to set up the git remote before the PR workflow can function. This is a prerequisite for the entire PR-based update flow. The user needs to either create a GitHub repository or connect to an existing one.
**Warning signs:** `gh pr create` will fail immediately without a remote.

### Pitfall 5: Rate Limiting and IP Blocking from Aggressive Scraping
**What goes wrong:** Scraping all 11 vendors' sources (100+ URLs total) in rapid succession triggers rate limits or IP blocks. Subsequent requests fail, and the IP may be temporarily blacklisted.
**Why it happens:** No delays between requests, no concurrency limits, no respect for robots.txt crawl-delay directives.
**How to avoid:** Use p-limit to cap concurrent requests (default: 2). Add a configurable delay between requests to the same domain (default: 2 seconds). Check robots.txt before scraping each domain. Include a descriptive User-Agent string.
**Warning signs:** Increasing 429 (Too Many Requests) responses in scrape logs.

### Pitfall 6: Claude Code Passthrough Not Available in Scheduled Mode
**What goes wrong:** The LLM-assisted extraction (D-02) routes through the running Claude Code session. But scheduled polling (D-11) runs via Task Scheduler when no Claude Code session may be active.
**Why it happens:** Claude Code passthrough requires an active interactive session. Scheduled jobs run unattended.
**How to avoid:** Scheduled mode MUST use only the traditional scraper (D-01 already specifies this). The config should enforce that LLM-assisted mode is only available for manual and specific search modes. If a source is marked as "needs LLM extraction," scheduled mode should skip it and log it for manual follow-up.
**Warning signs:** Scheduled tasks attempting to invoke Claude Code and hanging or failing silently.

## Code Examples

### Loading and Merging Configuration
```typescript
// Source: Project patterns (npm scripts, Zod validation) [VERIFIED: existing codebase]
import { readFileSync } from 'node:fs';
import { z } from 'zod';

const VendorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  sources: z.record(z.string(), z.object({
    scrapeMode: z.enum(['active', 'reference-only']).default('active'),
    priority: z.number().default(0),
  })),
});

const IngestConfigSchema = z.object({
  vendors: z.record(z.string(), VendorConfigSchema),
  defaults: z.object({
    concurrency: z.number().default(2),
    timeoutMs: z.number().default(15000),
    retries: z.number().default(1),
    userAgent: z.string().default('edu-content-bot/1.0'),
  }),
  scheduling: z.object({
    frequency: z.enum(['daily', 'weekly']).default('weekly'),
    dayOfWeek: z.string().optional(),
    timeOfDay: z.string().default('06:00'),
  }),
});

type IngestConfig = z.infer<typeof IngestConfigSchema>;

function loadConfig(overrides: Partial<IngestConfig> = {}): IngestConfig {
  const raw = JSON.parse(readFileSync('ingest.config.json', 'utf-8'));
  const base = IngestConfigSchema.parse(raw);
  // Deep merge overrides from CLI flags
  return { ...base, ...overrides };
}
```

### Checking robots.txt Before Scraping
```typescript
// Source: robots-parser npm package [VERIFIED: npm registry]
import robotsParser from 'robots-parser';

async function canScrape(url: string, userAgent: string): Promise<boolean> {
  const urlObj = new URL(url);
  const robotsUrl = `${urlObj.origin}/robots.txt`;
  try {
    const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return true; // No robots.txt = allowed
    const robotsTxt = await response.text();
    const robots = robotsParser(robotsUrl, robotsTxt);
    return robots.isAllowed(url, userAgent) ?? true;
  } catch {
    return true; // Network error fetching robots.txt = proceed with caution
  }
}
```

### Diffing Scraped Data Against Existing Tool File
```typescript
// Source: Project patterns [VERIFIED: existing codebase uses JSON files]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface DiffResult {
  vendor: string;
  toolId: string;
  changedFields: string[];
  hasChanges: boolean;
}

function diffToolData(toolId: string, scrapedData: Record<string, unknown>): DiffResult {
  const toolPath = join('content', 'tools', `${toolId}.json`);
  const existing = JSON.parse(readFileSync(toolPath, 'utf-8'));

  const changedFields: string[] = [];
  // Compare specific updatable fields
  for (const [key, value] of Object.entries(scrapedData)) {
    if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      changedFields.push(key);
    }
  }

  return {
    vendor: existing.vendor,
    toolId,
    changedFields,
    hasChanges: changedFields.length > 0,
  };
}
```

### Windows Task Scheduler Setup
```typescript
// Source: Microsoft schtasks documentation [CITED: learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create]
import { execSync } from 'node:child_process';
import { join } from 'node:path';

function setupScheduledTask(config: { frequency: string; timeOfDay: string; dayOfWeek?: string }): void {
  const projectRoot = process.cwd();
  const taskName = 'edu-content-ingest';
  // Use node directly to run the npm script
  const nodeExe = process.execPath;
  const scriptPath = join(projectRoot, 'node_modules', '.bin', 'tsx');
  const ingestScript = join(projectRoot, 'scripts', 'ingest.ts');
  const taskRun = `"${nodeExe}" "${scriptPath}" "${ingestScript}" --mode scheduled`;

  const scheduleType = config.frequency === 'daily' ? 'DAILY' : 'WEEKLY';
  let cmd = `schtasks /create /tn "${taskName}" /tr ${taskRun} /sc ${scheduleType} /st ${config.timeOfDay} /f`;

  if (scheduleType === 'WEEKLY' && config.dayOfWeek) {
    cmd += ` /d ${config.dayOfWeek}`;
  }

  execSync(cmd, { stdio: 'inherit' });
}

function removeScheduledTask(): void {
  execSync('schtasks /delete /tn "edu-content-ingest" /f', { stdio: 'inherit' });
}
```

### npm Scripts Configuration
```json
{
  "scripts": {
    "ingest:poll": "tsx scripts/ingest.ts --mode poll",
    "ingest:search": "tsx scripts/ingest.ts --mode search",
    "ingest:schedule": "tsx scripts/ingest.ts --mode schedule-setup",
    "ingest:unschedule": "tsx scripts/ingest.ts --mode schedule-remove"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| axios + cheerio | Native fetch + cheerio | Node 18+ (2022) | No HTTP library dependency needed. `fetch` is built-in with timeout via `AbortSignal.timeout()` |
| Puppeteer for all scraping | Headless browser only when needed | Ongoing | cheerio handles server-rendered pages; browser needed only for JS-heavy SPAs |
| Custom cron jobs (node-cron) | OS-level scheduler (schtasks) | Always preferred for unattended operation | Survives process crashes, reboots; native OS logging and management |
| Manual robots.txt checking | robots-parser library | Always | Automated compliance with robots.txt directives |
| cheerio manual traversal | cheerio `$.extract()` API | cheerio 1.0+ | Declarative extraction maps replace imperative DOM traversal |

**Deprecated/outdated:**
- **request/request-promise:** Deprecated since 2020. Use native fetch.
- **jsdom for scraping:** Heavy, loads full DOM. cheerio is 10× faster for parsing-only use cases.
- **node-cron for scheduling:** Runs inside a Node process -- dies when the process exits. OS scheduler is more robust for unattended operation.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude Code passthrough can be invoked programmatically from a tsx script for LLM-assisted extraction | Architecture Patterns | HIGH -- if Claude Code doesn't support programmatic invocation from scripts, the LLM-assisted mode needs a different approach (e.g., structured prompts in the Claude Code chat) |
| A2 | Most vendor documentation pages (Anthropic, Google, Perplexity, DeepSeek, etc.) serve server-rendered HTML accessible via simple HTTP fetch | Pitfall 1 | MEDIUM -- verified for Anthropic (works) and OpenAI platform (403). Others not tested. Some may require browser-based scraping |
| A3 | The `gh` CLI can create PRs from branches pushed to the remote without additional configuration beyond what's already authenticated | Architecture Patterns | LOW -- verified authentication and scopes (repo, workflow), but no remote is configured yet |

## Open Questions (RESOLVED)

1. **Git remote not configured** (RESOLVED — defensive check in pr-workflow.ts)
   - What we know: `git remote -v` returns empty. `gh repo view` fails with "no git remotes found". [VERIFIED]
   - Resolution: Plan 04-04-01 adds `checkGitRemote()` to pr-workflow.ts. Returns `{ configured: false }` with clear setup instructions when no remote. createVendorPR throws with actionable message before attempting push. User sets up remote manually before first PR run.

2. **Claude Code passthrough mechanism** (RESOLVED — structured prompt approach)
   - What we know: D-02 specifies Claude Code as the LLM backend for manual pulls, routed through the running session.
   - Resolution: Plan 04-04-02 creates llm-extract.ts that generates structured markdown prompts written to `logs/ingest/pending-*.md`. User opens file and processes through Claude Code session. No IPC or programmatic invocation.

3. **Extraction selectors per vendor** (RESOLVED — default maps + skip-and-log)
   - What we know: Each vendor's docs have different HTML structures.
   - Resolution: Plan 04-02-02 creates DEFAULT_EXTRACTION_MAPS for common page types (changelog, features, pricing). Missing selectors handled by skip-and-log (D-04). Selectors added incrementally.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | Yes | 24.13.0 | -- |
| npm | Package management, CLI scripts | Yes | 11.6.2 | -- |
| git | Branch/PR workflow | Yes | 2.50.1 | -- |
| gh CLI | PR creation | Yes | 2.86.0 | Manual git push + GitHub web UI |
| schtasks | Windows Task Scheduler | Yes | Built-in | -- |
| tsx | TypeScript execution | Yes | ^4.19.0 (devDependency) | -- |
| cheerio | HTML parsing | No (to install) | 1.2.0 | -- |
| robots-parser | robots.txt compliance | No (to install) | 3.0.1 | -- |
| p-limit | Concurrency control | No (to install) | 7.3.0 | -- |
| Git remote | PR workflow (D-05) | **No** | -- | Must be configured before PR workflow |

**Missing dependencies with no fallback:**
- **Git remote:** No remote configured. PR workflow (D-05, D-06) is completely blocked until a remote is added. Planner must address this as a prerequisite task.

**Missing dependencies with fallback:**
- None. All npm packages (cheerio, robots-parser, p-limit) are straightforward installs.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.6 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-06-a | Config loading and validation (ingest.config.json + CLI overrides) | unit | `npx vitest run test/ingest-config.test.ts -x` | Wave 0 |
| CONT-06-b | Traditional scraper fetches HTML and extracts data via cheerio selectors | unit | `npx vitest run test/scraper.test.ts -x` | Wave 0 |
| CONT-06-c | Extracted data validates against existing ToolSchema | unit | `npx vitest run test/ingest-validation.test.ts -x` | Wave 0 |
| CONT-06-d | Diff engine detects changes between scraped data and existing tool JSON | unit | `npx vitest run test/differ.test.ts -x` | Wave 0 |
| CONT-06-e | Skip-and-log on scrape failure (403, timeout, parse error) | unit | `npx vitest run test/scraper.test.ts -x` | Wave 0 |
| CONT-06-f | Per-vendor PR creation via gh CLI | integration | `npx vitest run test/pr-workflow.test.ts -x` | Wave 0 |
| CONT-06-g | npm scripts invoke correct ingestion mode | smoke | `npm run ingest:poll -- --vendor anthropic --dry-run` | Wave 0 |
| CONT-06-h | Scheduled task setup/removal via schtasks | manual-only | Manual: run `npm run ingest:schedule` and verify in Task Scheduler | Justification: schtasks modifies OS state, not safely automatable in tests |
| CONT-06-i | robots.txt checking before scraping | unit | `npx vitest run test/scraper.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/ingest-config.test.ts` -- config loading, validation, CLI override merge
- [ ] `test/scraper.test.ts` -- HTTP scraping, cheerio extraction, robots.txt, error handling
- [ ] `test/differ.test.ts` -- diff detection between scraped and existing data
- [ ] `test/ingest-validation.test.ts` -- scraped data against ToolSchema/SourceFileSchema
- [ ] `test/pr-workflow.test.ts` -- git branch creation, PR creation (can mock gh CLI)
- [ ] Install test dependencies: `npm install cheerio robots-parser p-limit`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- no user authentication in scraping scripts |
| V3 Session Management | No | N/A -- stateless CLI scripts |
| V4 Access Control | No | N/A -- local filesystem, no multi-user access |
| V5 Input Validation | Yes | Zod schema validation on all scraped data before writing to content files. Never trust HTML content. Sanitize any user-provided CLI flags |
| V6 Cryptography | No | N/A -- no encryption needed |

### Known Threat Patterns for Web Scraping Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Scraped HTML contains malicious content injected into JSON | Tampering | Zod validation rejects non-conforming data. cheerio parses HTML safely (no script execution). Extract text content only, never raw HTML into JSON fields |
| Command injection via vendor names in shell commands | Tampering | Sanitize vendor names before using in `execSync()` commands (branch names, PR titles). Use allowlist of known vendor IDs from config |
| Excessive disk usage from scrape logs | Denial of Service | Rotate log files. Set max log file size in config. Delete logs older than 30 days |
| GitHub token exposure in logs | Information Disclosure | gh CLI handles auth token internally. Never log full git/gh command output that might contain tokens |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] cheerio 1.2.0, robots-parser 3.0.1, p-limit 7.3.0 -- version numbers confirmed via `npm view`
- [VERIFIED: Context7 /cheeriojs/cheerio] cheerio API documentation -- `$.extract()`, `$.load()`, selector patterns
- [VERIFIED: codebase] Existing schemas (tool.ts, source.ts, capabilities.ts), validation script, test infrastructure, package.json, tsconfig.json
- [VERIFIED: environment] Node 24.13.0 with native fetch, gh CLI 2.86.0 authenticated, schtasks available
- [CITED: learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create] Windows Task Scheduler schtasks /create documentation -- schedule types, parameters, examples

### Secondary (MEDIUM confidence)
- [VERIFIED: WebFetch] Anthropic docs (platform.claude.com) serve clean server-rendered HTML, scrapable via simple HTTP fetch
- [VERIFIED: WebFetch] OpenAI platform docs (platform.openai.com) return 403 -- confirms need for dual-method strategy

### Tertiary (LOW confidence)
- [ASSUMED] Claude Code passthrough mechanism for LLM-assisted extraction -- exact invocation pattern unclear
- [ASSUMED] Most other vendor docs (Google, Perplexity, xAI, DeepSeek, Alibaba, Comet, Manus) are server-rendered and scrapable -- not individually verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm registry, existing codebase patterns clear
- Architecture: HIGH -- builds on established project patterns (TypeScript, Zod, npm scripts, git workflow)
- Pitfalls: HIGH -- primary risk (vendor anti-bot) verified empirically; mitigated by locked decision D-01/D-04
- PR workflow: MEDIUM -- gh CLI verified but git remote not configured (blocker noted)
- LLM-assisted mode: LOW -- Claude Code passthrough mechanism is assumed, not verified

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable domain -- scraping libraries and OS scheduler APIs don't change frequently)
