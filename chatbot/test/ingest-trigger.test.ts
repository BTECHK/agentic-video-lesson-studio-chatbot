import { describe, it, expect } from 'vitest';
import { buildIngestArgs, IngestTriggerSchema } from '@/lib/ingest-trigger';

describe('buildIngestArgs', () => {
  it('builds a poll-all command', () => {
    expect(buildIngestArgs({ mode: 'poll' })).toEqual(['--mode', 'poll']);
  });

  it('builds a per-vendor poll command', () => {
    expect(buildIngestArgs({ mode: 'poll', vendor: 'anthropic' })).toEqual([
      '--mode', 'poll', '--vendor', 'anthropic',
    ]);
  });

  it('builds a per-vendor search command', () => {
    expect(buildIngestArgs({ mode: 'search', vendor: 'openai-codex' })).toEqual([
      '--mode', 'search', '--vendor', 'openai-codex',
    ]);
  });

  it('rejects a vendor name with shell metacharacters', () => {
    expect(() => buildIngestArgs({ mode: 'poll', vendor: 'anthropic; rm -rf /' })).toThrow();
  });

  it('rejects search mode without a vendor', () => {
    expect(() => buildIngestArgs({ mode: 'search' })).toThrow();
  });
});

describe('IngestTriggerSchema', () => {
  it('accepts a valid poll request', () => {
    expect(IngestTriggerSchema.safeParse({ mode: 'poll' }).success).toBe(true);
  });

  it('rejects an unknown mode', () => {
    expect(IngestTriggerSchema.safeParse({ mode: 'nuke' }).success).toBe(false);
  });
});
