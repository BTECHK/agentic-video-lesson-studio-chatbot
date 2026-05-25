import { describe, it, expect } from 'vitest';
import { classifyVendorSources } from '../scripts/ingest';
import type { IngestConfig } from '../scripts/ingest/config';

function cfg(vendors: IngestConfig['vendors']): IngestConfig {
  return {
    defaults: { concurrency: 1, timeoutMs: 1000, retries: 0, delayMs: 0, userAgent: 'x', maxLogSizeMB: 10 },
    scheduling: { frequency: 'weekly', dayOfWeek: 'MON', timeOfDay: '06:00' },
    vendors,
  };
}

describe('classifyVendorSources', () => {
  it('flags a vendor whose sources are all reference-only as auto-scrape-inactive', () => {
    const { active, referenceOnly } = classifyVendorSources(
      cfg({ openai: { enabled: true, sources: { chatgpt: { scrapeMode: 'reference-only', priority: 10 } } } }),
    );
    expect(referenceOnly).toContain('openai');
    expect(active).not.toContain('openai');
  });

  it('treats a vendor with any active source as active', () => {
    const { active, referenceOnly } = classifyVendorSources(
      cfg({
        acme: {
          enabled: true,
          sources: { a: { scrapeMode: 'active', priority: 5 }, b: { scrapeMode: 'reference-only', priority: 5 } },
        },
      }),
    );
    expect(active).toContain('acme');
    expect(referenceOnly).not.toContain('acme');
  });

  it('ignores disabled vendors', () => {
    const { active, referenceOnly } = classifyVendorSources(
      cfg({ off: { enabled: false, sources: { a: { scrapeMode: 'reference-only', priority: 5 } } } }),
    );
    expect(active).not.toContain('off');
    expect(referenceOnly).not.toContain('off');
  });
});
