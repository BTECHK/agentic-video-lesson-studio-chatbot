import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

// --- Schemas ---

const SourceScrapeConfigSchema = z.object({
  scrapeMode: z.enum(['active', 'reference-only']),
  priority: z.number().int().min(0).max(10),
});

const VendorConfigSchema = z.object({
  enabled: z.boolean(),
  sources: z.record(z.string(), SourceScrapeConfigSchema).default({}),
});

const SchedulingSchema = z.object({
  frequency: z.enum(['daily', 'weekly']),
  dayOfWeek: z.string().optional(),
  timeOfDay: z.string(),
});

const DefaultsSchema = z.object({
  concurrency: z.number().int().min(1).max(10),
  timeoutMs: z.number().int().min(1000),
  retries: z.number().int().min(0).max(5),
  delayMs: z.number().int().min(0),
  userAgent: z.string().min(1),
  maxLogSizeMB: z.number().min(1).max(100),
});

export const IngestConfigSchema = z.object({
  defaults: DefaultsSchema,
  scheduling: SchedulingSchema,
  vendors: z.record(z.string(), VendorConfigSchema),
});

export type IngestConfig = z.infer<typeof IngestConfigSchema>;
export type VendorConfig = z.infer<typeof VendorConfigSchema>;
export type SourceScrapeConfig = z.infer<typeof SourceScrapeConfigSchema>;

// --- CLI override types ---

export interface CliOverrides {
  vendor?: string;
  concurrency?: number;
  timeout?: number;
  dryRun?: boolean;
}

// --- Config loader ---

export function loadConfig(overrides?: Partial<CliOverrides>): IngestConfig {
  const configPath = join(import.meta.dirname!, '..', '..', 'ingest.config.json');
  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  const result = IngestConfigSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid ingest config:\n${issues}`);
  }

  const config = result.data;

  // Apply CLI overrides
  if (overrides?.concurrency !== undefined) {
    config.defaults.concurrency = overrides.concurrency;
  }
  if (overrides?.timeout !== undefined) {
    config.defaults.timeoutMs = overrides.timeout;
  }

  return config;
}

// --- CLI flag parser ---

export function parseCliOverrides(args: string[]): CliOverrides {
  const overrides: CliOverrides = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--vendor' && i + 1 < args.length) {
      overrides.vendor = args[++i];
    } else if (arg === '--concurrency' && i + 1 < args.length) {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val)) overrides.concurrency = val;
    } else if (arg === '--timeout' && i + 1 < args.length) {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val)) overrides.timeout = val;
    } else if (arg === '--dry-run') {
      overrides.dryRun = true;
    }
  }

  return overrides;
}
