/**
 * Pure helpers for the Ingestion Control Panel (Phase 8.5). They turn the
 * ingest pipeline's JSONL run logs (logs/ingest/*.jsonl) + schedule config into
 * per-vendor freshness, last/next run, and staleness levels. No fs here — the
 * server loader reads the files and feeds strings/objects in.
 */

export interface IngestEvent {
  event: string;
  vendor?: string;
  mode?: string;
  vendorsProcessed?: number;
  changesFound?: number;
  prsCreated?: number;
  errors?: number;
  results?: { vendor: string; status: string; error?: string }[];
  _logged: string;
  [key: string]: unknown;
}

export interface IngestRun {
  mode: string;
  at: string;
  vendorsProcessed: number;
  changesFound: number;
  prsCreated: number;
  errors: number;
}

export type FreshnessLevel = 'fresh' | 'aging' | 'stale';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

/** Parse a JSONL ingest log, skipping malformed lines. */
export function parseIngestLog(text: string): IngestEvent[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as IngestEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is IngestEvent => e !== null && typeof e._logged === 'string');
}

/** Most recent scrape timestamp per vendor. */
export function lastRunPerVendor(events: IngestEvent[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of events) {
    if (e.event !== 'scrape_complete' || !e.vendor) continue;
    if (!map[e.vendor] || e._logged > map[e.vendor]) map[e.vendor] = e._logged;
  }
  return map;
}

/** The most recent ingest_complete summary, or null. */
export function latestRun(events: IngestEvent[]): IngestRun | null {
  const completions = events
    .filter((e) => e.event === 'ingest_complete')
    .sort((a, b) => (a._logged < b._logged ? 1 : -1));
  const last = completions[0];
  if (!last) return null;
  return {
    mode: last.mode ?? 'unknown',
    at: last._logged,
    vendorsProcessed: last.vendorsProcessed ?? 0,
    changesFound: last.changesFound ?? 0,
    prsCreated: last.prsCreated ?? 0,
    errors: last.errors ?? 0,
  };
}

/**
 * Each vendor's status ('success', 'skipped', ...) from the most recent
 * ingest_complete summary that mentions it. A vendor missing from the latest
 * summary keeps the status of the last run that included it.
 */
export function latestVendorStatus(events: IngestEvent[]): Record<string, string> {
  const map: Record<string, string> = {};
  const completions = events
    .filter((e) => e.event === 'ingest_complete' && Array.isArray(e.results))
    .sort((a, b) => (a._logged < b._logged ? -1 : 1));
  for (const e of completions) {
    for (const r of e.results!) {
      if (r.vendor && r.status) map[r.vendor] = r.status;
    }
  }
  return map;
}

export function periodDaysFor(frequency: ScheduleFrequency): number {
  return { daily: 1, weekly: 7, monthly: 30 }[frequency];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Freshness relative to the expected refresh cadence: fresh within one period,
 * aging within two, stale beyond (or never run).
 */
export function freshnessLevel(
  lastIso: string | undefined,
  nowIso: string,
  periodDays: number,
): FreshnessLevel {
  if (!lastIso) return 'stale';
  const ageDays = (new Date(nowIso).getTime() - new Date(lastIso).getTime()) / DAY_MS;
  if (ageDays <= periodDays) return 'fresh';
  if (ageDays <= periodDays * 2) return 'aging';
  return 'stale';
}

/** Next expected run = last run + one period. */
export function nextScheduledRun(lastIso: string, periodDays: number): string {
  return new Date(new Date(lastIso).getTime() + periodDays * DAY_MS).toISOString();
}
