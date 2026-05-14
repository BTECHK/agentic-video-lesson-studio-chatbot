import { describe, it, expect } from 'vitest';
import { IngestConfigSchema, loadConfig, parseCliOverrides } from '../scripts/ingest/config';

// --- Helper factory ---

function makeMinimalConfig(overrides: Record<string, unknown> = {}) {
  return {
    defaults: {
      concurrency: 2,
      timeoutMs: 15000,
      retries: 1,
      delayMs: 2000,
      userAgent: 'edu-content-bot/1.0',
      maxLogSizeMB: 10,
    },
    scheduling: {
      frequency: 'weekly',
      timeOfDay: '06:00',
    },
    vendors: {
      openai: { enabled: true, sources: {} },
    },
    ...overrides,
  };
}

// --- Tests ---

describe('IngestConfigSchema', () => {
  it('accepts a valid config', () => {
    const result = IngestConfigSchema.safeParse(makeMinimalConfig());
    expect(result.success).toBe(true);
  });

  it('rejects config with missing defaults', () => {
    const config = makeMinimalConfig();
    delete (config as Record<string, unknown>).defaults;
    expect(IngestConfigSchema.safeParse(config).success).toBe(false);
  });

  it('rejects invalid scheduling frequency', () => {
    const config = makeMinimalConfig({
      scheduling: { frequency: 'monthly', timeOfDay: '06:00' },
    });
    expect(IngestConfigSchema.safeParse(config).success).toBe(false);
  });

  it('accepts daily scheduling frequency', () => {
    const config = makeMinimalConfig({
      scheduling: { frequency: 'daily', timeOfDay: '09:00' },
    });
    expect(IngestConfigSchema.safeParse(config).success).toBe(true);
  });

  it('accepts empty vendors record', () => {
    const config = makeMinimalConfig({ vendors: {} });
    expect(IngestConfigSchema.safeParse(config).success).toBe(true);
  });

  it('rejects concurrency below 1', () => {
    const config = makeMinimalConfig();
    (config.defaults as Record<string, unknown>).concurrency = 0;
    expect(IngestConfigSchema.safeParse(config).success).toBe(false);
  });

  it('rejects missing userAgent', () => {
    const config = makeMinimalConfig();
    (config.defaults as Record<string, unknown>).userAgent = '';
    expect(IngestConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe('loadConfig', () => {
  it('returns a valid IngestConfig from disk', () => {
    const config = loadConfig();
    expect(config.defaults.concurrency).toBe(2);
    expect(config.scheduling.frequency).toBe('weekly');
    expect(Object.keys(config.vendors).length).toBe(11);
  });

  it('applies concurrency override', () => {
    const config = loadConfig({ concurrency: 5 });
    expect(config.defaults.concurrency).toBe(5);
  });

  it('applies timeout override', () => {
    const config = loadConfig({ timeout: 30000 });
    expect(config.defaults.timeoutMs).toBe(30000);
  });
});

describe('parseCliOverrides', () => {
  it('parses --vendor flag', () => {
    const result = parseCliOverrides(['--vendor', 'openai']);
    expect(result.vendor).toBe('openai');
  });

  it('parses --concurrency flag', () => {
    const result = parseCliOverrides(['--concurrency', '4']);
    expect(result.concurrency).toBe(4);
  });

  it('parses --dry-run flag', () => {
    const result = parseCliOverrides(['--dry-run']);
    expect(result.dryRun).toBe(true);
  });

  it('parses multiple flags together', () => {
    const result = parseCliOverrides([
      '--vendor', 'anthropic',
      '--concurrency', '3',
      '--timeout', '20000',
      '--dry-run',
    ]);
    expect(result.vendor).toBe('anthropic');
    expect(result.concurrency).toBe(3);
    expect(result.timeout).toBe(20000);
    expect(result.dryRun).toBe(true);
  });

  it('returns empty overrides for no flags', () => {
    const result = parseCliOverrides([]);
    expect(result.vendor).toBeUndefined();
    expect(result.concurrency).toBeUndefined();
    expect(result.dryRun).toBeUndefined();
  });
});
