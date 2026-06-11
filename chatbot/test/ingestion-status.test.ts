import { describe, it, expect } from 'vitest';
import {
  parseIngestLog,
  lastRunPerVendor,
  latestRun,
  latestVendorStatus,
  freshnessLevel,
  periodDaysFor,
  nextScheduledRun,
  type IngestEvent,
} from '@/lib/ingestion-status';

const SAMPLE = [
  '{"event":"scrape_complete","vendor":"anthropic","results":4,"_logged":"2026-05-15T02:40:00.000Z"}',
  'not json — should be skipped',
  '{"event":"scrape_complete","vendor":"google","results":3,"_logged":"2026-05-15T02:40:10.000Z"}',
  '{"event":"ingest_complete","mode":"poll","vendorsProcessed":11,"changesFound":0,"prsCreated":0,"errors":0,"_logged":"2026-05-15T02:41:10.000Z"}',
].join('\n');

describe('parseIngestLog', () => {
  it('parses JSONL lines and skips malformed ones', () => {
    const events = parseIngestLog(SAMPLE);
    expect(events).toHaveLength(3);
    expect(events[0].event).toBe('scrape_complete');
  });

  it('returns an empty array for empty input', () => {
    expect(parseIngestLog('')).toEqual([]);
  });
});

describe('lastRunPerVendor', () => {
  it('maps each vendor to its most recent scrape timestamp', () => {
    const events: IngestEvent[] = [
      { event: 'scrape_complete', vendor: 'anthropic', _logged: '2026-05-14T00:00:00.000Z' },
      { event: 'scrape_complete', vendor: 'anthropic', _logged: '2026-05-15T00:00:00.000Z' },
      { event: 'scrape_complete', vendor: 'google', _logged: '2026-05-15T00:00:00.000Z' },
    ];
    const map = lastRunPerVendor(events);
    expect(map.anthropic).toBe('2026-05-15T00:00:00.000Z');
    expect(map.google).toBe('2026-05-15T00:00:00.000Z');
  });
});

describe('latestRun', () => {
  it('returns the most recent ingest_complete summary', () => {
    const run = latestRun(parseIngestLog(SAMPLE));
    expect(run).not.toBeNull();
    expect(run!.mode).toBe('poll');
    expect(run!.at).toBe('2026-05-15T02:41:10.000Z');
  });

  it('returns null when there is no completed run', () => {
    expect(latestRun([])).toBeNull();
  });
});

describe('latestVendorStatus', () => {
  it('maps each vendor to its status from the most recent run that mentions it', () => {
    const events: IngestEvent[] = [
      {
        event: 'ingest_complete',
        _logged: '2026-05-15T00:00:00.000Z',
        results: [
          { vendor: 'openai', status: 'success' },
          { vendor: 'anthropic', status: 'success' },
        ],
      },
      {
        event: 'ingest_complete',
        _logged: '2026-05-28T00:00:00.000Z',
        results: [
          { vendor: 'openai', status: 'skipped', error: 'no successful scrapes' },
          { vendor: 'anthropic', status: 'success' },
        ],
      },
    ];
    const map = latestVendorStatus(events);
    expect(map.openai).toBe('skipped');
    expect(map.anthropic).toBe('success');
  });

  it('retains a vendor status from a prior run when the latest run omits it', () => {
    const events: IngestEvent[] = [
      {
        event: 'ingest_complete',
        _logged: '2026-05-28T00:00:00.000Z',
        results: [{ vendor: 'openai', status: 'skipped' }],
      },
      {
        event: 'ingest_complete',
        _logged: '2026-05-28T00:01:00.000Z',
        results: [{ vendor: 'anthropic', status: 'success' }],
      },
    ];
    const map = latestVendorStatus(events);
    expect(map.openai).toBe('skipped');
    expect(map.anthropic).toBe('success');
  });

  it('returns an empty map when there are no completed runs', () => {
    expect(latestVendorStatus([])).toEqual({});
  });
});

describe('periodDaysFor', () => {
  it('maps schedule frequency to a period in days', () => {
    expect(periodDaysFor('daily')).toBe(1);
    expect(periodDaysFor('weekly')).toBe(7);
    expect(periodDaysFor('monthly')).toBe(30);
  });
});

describe('freshnessLevel', () => {
  const now = '2026-05-24T00:00:00.000Z';
  it('is fresh within one period', () => {
    expect(freshnessLevel('2026-05-20T00:00:00.000Z', now, 7)).toBe('fresh');
  });
  it('is aging between one and two periods', () => {
    expect(freshnessLevel('2026-05-15T00:00:00.000Z', now, 7)).toBe('aging');
  });
  it('is stale beyond two periods', () => {
    expect(freshnessLevel('2026-05-01T00:00:00.000Z', now, 7)).toBe('stale');
  });
  it('is stale when never run', () => {
    expect(freshnessLevel(undefined, now, 7)).toBe('stale');
  });
});

describe('nextScheduledRun', () => {
  it('adds one period to the last run', () => {
    const next = nextScheduledRun('2026-05-15T06:00:00.000Z', 7);
    expect(next).toBe('2026-05-22T06:00:00.000Z');
  });
});
