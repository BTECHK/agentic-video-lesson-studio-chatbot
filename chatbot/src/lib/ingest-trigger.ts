import { z } from 'zod';

/**
 * Manual-refresh trigger for the Ingestion Control Panel (Phase 8.5). The
 * underlying pipeline (scripts/ingest.ts) supports vendor-scoped `poll` and
 * `search` modes; topic-scoped ad hoc search is not yet a pipeline capability.
 */
export const IngestTriggerSchema = z.object({
  mode: z.enum(['poll', 'search']),
  vendor: z.string().optional(),
});

export type IngestTrigger = z.infer<typeof IngestTriggerSchema>;

// Vendor ids are lowercase alphanumeric + hyphen (mirrors the pipeline's
// T-04-02 sanitization) — defense in depth before the value reaches a shell.
const VENDOR_PATTERN = /^[a-z0-9-]+$/;

/** Turn a validated trigger into safe CLI args for `npm run ingest`. */
export function buildIngestArgs(trigger: IngestTrigger): string[] {
  const args = ['--mode', trigger.mode];
  if (trigger.mode === 'search' && !trigger.vendor) {
    throw new Error('search mode requires a vendor');
  }
  if (trigger.vendor) {
    if (!VENDOR_PATTERN.test(trigger.vendor)) {
      throw new Error(`invalid vendor id: ${trigger.vendor}`);
    }
    args.push('--vendor', trigger.vendor);
  }
  return args;
}
