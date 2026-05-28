import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ToolSchema, validateProductInvariant, type Tool } from '../content/schemas/tool';
import { SourceFileSchema } from '../content/schemas/source';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const toolsDir = join(import.meta.dirname!, '..', 'content', 'tools');
const sourcesDir = join(import.meta.dirname!, '..', 'content', 'sources');
const logsDir = join(import.meta.dirname!, '..', 'logs', 'ingest');

let passed = 0;
let failed = 0;
const errors: string[] = [];
const warnings: string[] = [];
const expectedSourceKeys = new Set<string>();

interface IngestVendorResult {
  vendor?: string;
  status?: string;
  error?: string;
}

interface IngestLogEvent {
  event?: string;
  mode?: string;
  vendor?: string;
  sourceId?: string;
  status?: string;
  error?: string;
  results?: IngestVendorResult[];
  _logged?: string;
}

function warn(message: string): void {
  warnings.push(message);
}

function parseArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && i + 1 < process.argv.length) {
    return process.argv[i + 1];
  }
  return undefined;
}

function findLatestIngestLog(explicitPath: string | undefined): string | null {
  if (explicitPath) {
    return explicitPath;
  }
  if (!existsSync(logsDir)) return null;
  const candidates = readdirSync(logsDir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort();
  const latest = candidates[candidates.length - 1];
  if (!latest) return null;
  return join(logsDir, latest);
}

function parseIngestEvents(logPath: string): IngestLogEvent[] {
  if (!existsSync(logPath)) return [];
  const raw = readFileSync(logPath, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as IngestLogEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is IngestLogEvent => Boolean(event && event._logged));
}

function newestByLogged<T extends { _logged?: string }>(events: T[]): T | null {
  if (events.length === 0) return null;
  return [...events].sort((a, b) => (a._logged! < b._logged! ? 1 : -1))[0];
}

// --- Validate tool files ---
console.log(`${BOLD}Validating tool files...${RESET}\n`);

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
const parsedTools: Tool[] = [];

for (const file of toolFiles) {
  const filePath = join(toolsDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = ToolSchema.safeParse(raw);

  if (result.success) {
    console.log(`  ${GREEN}PASS${RESET}  ${file}`);
    parsedTools.push(result.data);
    passed++;
  } else {
    console.log(`  ${RED}FAIL${RESET}  ${file}`);
    const issues = result.error.issues.map(
      (i) => `    - ${i.path.join('.')}: ${i.message}`,
    );
    errors.push(`${file}:\n${issues.join('\n')}`);
    failed++;
  }
}

// --- Validate product taxonomy invariant ---
console.log(`\n${BOLD}Validating product taxonomy...${RESET}\n`);

const invariantErrors = validateProductInvariant(parsedTools);
if (invariantErrors.length === 0) {
  console.log(`  ${GREEN}PASS${RESET}  every product has exactly one primary surface`);
  passed++;
} else {
  for (const e of invariantErrors) {
    console.log(`  ${RED}FAIL${RESET}  ${e}`);
    errors.push(e);
    failed++;
  }
}

// --- Validate source files ---
console.log(`\n${BOLD}Validating source files...${RESET}\n`);

const sourceFiles = readdirSync(sourcesDir).filter((f) => f.endsWith('.json'));

// Build source ID set for cross-reference checking
const allSourceIds = new Set<string>();

for (const file of sourceFiles) {
  const filePath = join(sourcesDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const result = SourceFileSchema.safeParse(raw);

  if (result.success) {
    console.log(`  ${GREEN}PASS${RESET}  ${file}`);
    for (const s of result.data.sources) {
      allSourceIds.add(s.id);
      expectedSourceKeys.add(`${result.data.vendor}:${s.id}`);
    }
    passed++;
  } else {
    console.log(`  ${RED}FAIL${RESET}  ${file}`);
    const issues = result.error.issues.map(
      (i) => `    - ${i.path.join('.')}: ${i.message}`,
    );
    errors.push(`${file}:\n${issues.join('\n')}`);
    failed++;
  }
}

// --- Cross-reference: tool sourceRefs -> source IDs ---
console.log(`\n${BOLD}Cross-referencing sourceRefs...${RESET}\n`);

for (const file of toolFiles) {
  const filePath = join(toolsDir, file);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  const toolName = basename(file, '.json');
  const sourceRefs: string[] = raw.sourceRefs ?? [];
  const missing = sourceRefs.filter((ref) => !allSourceIds.has(ref));

  if (missing.length === 0) {
    console.log(`  ${GREEN}PASS${RESET}  ${toolName}: all ${sourceRefs.length} refs found`);
    passed++;
  } else {
    console.log(
      `  ${YELLOW}WARN${RESET}  ${toolName}: missing refs: ${missing.join(', ')}`,
    );
    errors.push(`${toolName} cross-ref: missing source IDs: ${missing.join(', ')}`);
    failed++;
  }
}

// --- Validate ingest log freshness/staleness signals ---
console.log(`\n${BOLD}Validating ingest log signals...${RESET}\n`);

const explicitLog = parseArg('--ingest-log') ?? process.env.INGEST_LOG_PATH;
const ingestLogPath = findLatestIngestLog(explicitLog);

if (!ingestLogPath) {
  console.log(`  ${YELLOW}WARN${RESET}  no ingest log found (skipping runtime freshness checks)`);
  warn('No ingest log found; runtime freshness checks were skipped.');
} else {
  const events = parseIngestEvents(ingestLogPath);
  if (events.length === 0) {
    console.log(`  ${YELLOW}WARN${RESET}  ingest log unreadable or empty: ${ingestLogPath}`);
    warn(`Ingest log unreadable or empty: ${ingestLogPath}`);
  } else {
    console.log(`  ${GREEN}PASS${RESET}  parsed ${events.length} ingest events from ${ingestLogPath}`);
    passed++;

    const latestComplete = newestByLogged(
      events.filter((e) => e.event === 'ingest_complete'),
    );
    if (!latestComplete) {
      console.log(`  ${YELLOW}WARN${RESET}  no ingest_complete event found`);
      warn('No ingest_complete event found in ingest logs.');
    } else {
      const results = Array.isArray(latestComplete.results)
        ? latestComplete.results
        : [];
      if (results.length === 0) {
        console.log(`  ${YELLOW}WARN${RESET}  latest ingest_complete has no vendor results`);
        warn('Latest ingest_complete event has no vendor results.');
      }

      for (const result of results) {
        const vendor = result.vendor ?? 'unknown-vendor';
        const status = result.status ?? 'unknown';
        const reason = (result.error ?? '').trim();
        if (status === 'error') {
          console.log(`  ${RED}FAIL${RESET}  ${vendor}: ingest result status=error (${reason || 'no reason'})`);
          errors.push(`ingest_complete: ${vendor} status=error (${reason || 'no reason'})`);
          failed++;
          continue;
        }

        if (status === 'skipped' && /no successful scrapes/i.test(reason)) {
          console.log(`  ${RED}FAIL${RESET}  ${vendor}: skipped with "no successful scrapes"`);
          errors.push(`ingest_complete: ${vendor} skipped due to no successful scrapes`);
          failed++;
          continue;
        }

        if (status === 'skipped') {
          console.log(`  ${YELLOW}WARN${RESET}  ${vendor}: skipped (${reason || 'no reason'})`);
          warn(`ingest_complete: ${vendor} skipped (${reason || 'no reason'})`);
          continue;
        }

        console.log(`  ${GREEN}PASS${RESET}  ${vendor}: ${status}`);
        passed++;
      }
    }

    // Per-source freshness tracking from source_scrape_result events.
    const latestSource = new Map<
      string,
      { status: string; at: string; error?: string }
    >();

    for (const e of events) {
      if (e.event !== 'source_scrape_result' || !e.vendor || !e.sourceId || !e._logged) {
        continue;
      }
      const key = `${e.vendor}:${e.sourceId}`;
      const current = latestSource.get(key);
      if (!current || current.at < e._logged) {
        latestSource.set(key, {
          status: e.status ?? 'unknown',
          at: e._logged,
          error: e.error,
        });
      }
    }

    if (latestSource.size === 0) {
      console.log(`  ${YELLOW}WARN${RESET}  no source_scrape_result events found (source freshness unavailable)`);
      warn('No source_scrape_result events found; per-source freshness unavailable.');
    } else {
      let sourcePasses = 0;
      let sourceWarnings = 0;

      for (const key of expectedSourceKeys) {
        const latest = latestSource.get(key);
        if (!latest) {
          sourceWarnings++;
          continue;
        }
        if (latest.status === 'success') {
          sourcePasses++;
        } else {
          sourceWarnings++;
        }
      }

      console.log(
        `  ${GREEN}PASS${RESET}  per-source freshness tracked for ${sourcePasses}/${expectedSourceKeys.size} sources`,
      );
      passed++;

      if (sourceWarnings > 0) {
        const msg = `${sourceWarnings} source(s) are missing a recent success in logs`;
        console.log(`  ${YELLOW}WARN${RESET}  ${msg}`);
        warn(msg);
      }
    }
  }
}

// --- Summary ---
console.log(`\n${BOLD}Summary${RESET}`);
console.log(`  Passed: ${GREEN}${passed}${RESET}`);
console.log(`  Failed: ${RED}${failed}${RESET}`);
console.log(`  Warnings: ${YELLOW}${warnings.length}${RESET}`);

if (errors.length > 0) {
  console.log(`\n${RED}${BOLD}Errors:${RESET}`);
  for (const err of errors) {
    console.log(`\n  ${err}`);
  }
}

if (warnings.length > 0) {
  console.log(`\n${YELLOW}${BOLD}Warnings:${RESET}`);
  for (const warning of warnings) {
    console.log(`\n  ${warning}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
