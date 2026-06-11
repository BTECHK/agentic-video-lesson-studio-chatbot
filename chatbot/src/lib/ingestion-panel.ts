import 'server-only';
import fs from 'fs';
import path from 'path';
import {
  parseIngestLog,
  lastRunPerVendor,
  latestRun,
  latestVendorStatus,
  freshnessLevel,
  periodDaysFor,
  nextScheduledRun,
  type FreshnessLevel,
  type IngestRun,
  type ScheduleFrequency,
} from './ingestion-status';

const ROOT = path.join(process.cwd(), '..');
const LOG_DIR = path.join(ROOT, 'logs', 'ingest');
const CONFIG_PATH = path.join(ROOT, 'ingest.config.json');

export interface VendorRow {
  vendor: string;
  enabled: boolean;
  lastRun?: string;
  freshness: FreshnessLevel;
  /** True when the vendor's most recent ingest run result was 'skipped'. */
  skipped: boolean;
}

export interface IngestionPanelData {
  vendors: VendorRow[];
  schedule: { frequency: ScheduleFrequency; dayOfWeek: string; timeOfDay: string };
  latestRun: IngestRun | null;
  nextRun: string | null;
  generatedAt: string;
}

interface IngestConfig {
  scheduling?: { frequency?: string; dayOfWeek?: string; timeOfDay?: string };
  vendors?: Record<string, { enabled?: boolean }>;
}

function readAllLogs(): string {
  if (!fs.existsSync(LOG_DIR)) return '';
  return fs
    .readdirSync(LOG_DIR)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => fs.readFileSync(path.join(LOG_DIR, f), 'utf-8'))
    .join('\n');
}

/** Load the live ingestion control-panel view model from logs + config. */
export function getIngestionPanelData(nowIso: string = new Date().toISOString()): IngestionPanelData {
  const config: IngestConfig = fs.existsSync(CONFIG_PATH)
    ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
    : {};

  const frequency = (config.scheduling?.frequency as ScheduleFrequency) ?? 'weekly';
  const period = periodDaysFor(frequency);

  const events = parseIngestLog(readAllLogs());
  const perVendor = lastRunPerVendor(events);
  const statuses = latestVendorStatus(events);
  const run = latestRun(events);

  const vendors: VendorRow[] = Object.entries(config.vendors ?? {})
    .map(([vendor, cfg]) => ({
      vendor,
      enabled: cfg.enabled ?? true,
      lastRun: perVendor[vendor],
      freshness: freshnessLevel(perVendor[vendor], nowIso, period),
      skipped: statuses[vendor] === 'skipped',
    }))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));

  return {
    vendors,
    schedule: {
      frequency,
      dayOfWeek: config.scheduling?.dayOfWeek ?? '—',
      timeOfDay: config.scheduling?.timeOfDay ?? '—',
    },
    latestRun: run,
    nextRun: run ? nextScheduledRun(run.at, period) : null,
    generatedAt: nowIso,
  };
}
