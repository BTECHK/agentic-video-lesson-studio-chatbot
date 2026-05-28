import { describe, it, expect } from 'vitest';
import { benchmarks, getBenchmark, BENCHMARK_SOURCES } from '../src/lib/benchmarks';

const RETIRED_MODELS = [
  'GPT-4o',
  'GPT-4.1',
  'Claude Sonnet 4',
  'Claude Opus 4',
  'Gemini 2.5 Pro',
  'Grok-3',
  'DeepSeek-V3',
];

describe('benchmarks freshness (#35)', () => {
  it('contains no retired/stale primary models', () => {
    const models = Object.values(benchmarks).map((b) => b.primaryModel);
    for (const retired of RETIRED_MODELS) {
      expect(models, `stale model present: ${retired}`).not.toContain(retired);
    }
  });

  it('uses current-generation flagship models', () => {
    expect(getBenchmark('chatgpt')?.primaryModel).toBe('GPT-5.5');
    expect(getBenchmark('claude')?.primaryModel).toBe('Claude Opus 4.8');
    expect(getBenchmark('gemini')?.primaryModel).toBe('Gemini 3.5 Flash');
    expect(getBenchmark('grok')?.primaryModel).toBe('Grok 4.3');
    expect(getBenchmark('deepseek')?.primaryModel).toBe('DeepSeek-V4');
  });

  it('exposes an attributed source + as-of date for every third-party metric', () => {
    for (const key of ['arenaElo', 'qualityIndex', 'speedTps'] as const) {
      const s = BENCHMARK_SOURCES[key];
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.asOf.length).toBeGreaterThan(0);
    }
    // Aggregator metrics must carry a clickable URL.
    expect(BENCHMARK_SOURCES.arenaElo.url).toMatch(/^https?:\/\//);
    expect(BENCHMARK_SOURCES.qualityIndex.url).toMatch(/^https?:\/\//);
  });

  it('allows null metrics for non-comparable surfaces (no fabricated numbers)', () => {
    expect(getBenchmark('grok')?.arenaElo).toBeNull(); // not yet rated as of May 2026
    expect(getBenchmark('claude-code')?.arenaElo).toBeNull(); // coding-agent surface
    expect(getBenchmark('perplexity')?.contextWindow).toBeNull(); // answer engine
  });

  it('returns null for an unknown tool id', () => {
    expect(getBenchmark('nope')).toBeNull();
  });
});
