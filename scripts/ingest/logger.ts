import { mkdirSync, appendFileSync, readdirSync, statSync, unlinkSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import type { ScrapeResult } from './scraper';

// --- Constants ---

const LOG_DIR = join(import.meta.dirname!, '..', '..', 'logs', 'ingest');
const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10MB default

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// --- Log path ---

export function getLogPath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return join(LOG_DIR, `ingest-${date}.jsonl`);
}

// --- Log entry ---

export function log(entry: Record<string, unknown>): void {
  const logPath = getLogPath();
  mkdirSync(LOG_DIR, { recursive: true });

  // Check file size before appending
  try {
    const stats = statSync(logPath);
    if (stats.size >= MAX_LOG_SIZE_BYTES) {
      // Rotate: rename current file and start fresh
      const rotatedPath = logPath.replace('.jsonl', `-${Date.now()}.jsonl`);
      renameSync(logPath, rotatedPath);
    }
  } catch {
    // File doesn't exist yet — fine
  }

  const line = JSON.stringify({ ...entry, _logged: new Date().toISOString() });
  appendFileSync(logPath, line + '\n', 'utf-8');
}

// --- Log rotation ---

export function rotateLogs(maxAgeDays: number = 30): number {
  let deleted = 0;

  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const files = readdirSync(LOG_DIR).filter((f) => f.endsWith('.jsonl'));
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = join(LOG_DIR, file);
      const stats = statSync(filePath);
      if (stats.mtimeMs < cutoff) {
        unlinkSync(filePath);
        deleted++;
      }
    }
  } catch {
    // Log directory may not exist — nothing to rotate
  }

  return deleted;
}

// --- Console summary ---

export function printSummary(results: ScrapeResult[]): void {
  const success = results.filter((r) => r.status === 'success');
  const skipped = results.filter((r) => r.status === 'skipped');
  const errors = results.filter((r) => r.status === 'error');

  console.log(`\n${BOLD}Scrape Summary${RESET}`);
  console.log(`  ${GREEN}Success: ${success.length}${RESET}`);
  console.log(`  ${YELLOW}Skipped: ${skipped.length}${RESET}`);
  console.log(`  ${RED}Errors:  ${errors.length}${RESET}`);

  if (skipped.length > 0) {
    console.log(`\n${YELLOW}Skipped:${RESET}`);
    for (const r of skipped) {
      console.log(`  - ${r.sourceId}: ${r.error}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n${RED}Errors:${RESET}`);
    for (const r of errors) {
      console.log(`  - ${r.sourceId}: ${r.error}`);
    }
  }

  console.log('');
}
