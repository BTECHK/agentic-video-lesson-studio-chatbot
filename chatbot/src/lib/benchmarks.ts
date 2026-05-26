/**
 * Benchmark + headline-spec data for the Tool Comparison page.
 *
 * Sourcing policy (#35/#36, owner decision 2026-05-26):
 * - primaryModel / contextWindow / pricePerMTokens → VENDOR-OFFICIAL
 *   (each vendor's own docs; see .planning/research/vendor-official/).
 * - arenaElo / qualityIndex / speedTps → THIRD-PARTY aggregators that vendors
 *   don't publish, kept WITH attribution (see BENCHMARK_SOURCES): LMSYS Chatbot
 *   Arena + Artificial Analysis, as of mid-to-late May 2026.
 *
 * null = not published / not yet rated / not comparable on that axis (e.g. a
 * coding-agent surface or answer-engine that isn't a rated chat model). We show
 * "—" rather than a stale or invented number.
 */

export interface MetricSource {
  label: string;
  url: string;
  asOf: string;
}

/** Per-metric provenance, surfaced as a footnote on the compare UI. */
export const BENCHMARK_SOURCES: Record<
  'model' | 'contextWindow' | 'pricePerMTokens' | 'arenaElo' | 'qualityIndex' | 'speedTps',
  MetricSource
> = {
  model: { label: 'Vendor docs (official)', url: '', asOf: 'May 2026' },
  contextWindow: { label: 'Vendor docs (official)', url: '', asOf: 'May 2026' },
  pricePerMTokens: {
    label: 'Vendor docs / Artificial Analysis',
    url: 'https://artificialanalysis.ai/models',
    asOf: 'May 2026',
  },
  arenaElo: {
    label: 'LMSYS Chatbot Arena',
    url: 'https://openlm.ai/chatbot-arena/',
    asOf: 'May 18, 2026',
  },
  qualityIndex: {
    label: 'Artificial Analysis Intelligence Index',
    url: 'https://artificialanalysis.ai/models',
    asOf: 'May 2026',
  },
  speedTps: {
    label: 'Artificial Analysis',
    url: 'https://artificialanalysis.ai/models',
    asOf: 'May 2026',
  },
};

export interface BenchmarkEntry {
  /** Primary model powering the tool (vendor-official). */
  primaryModel: string;
  /** Context window in tokens (vendor-official); null if not a token-based product. */
  contextWindow: number | null;
  /** API price, $ per 1M output tokens; null if subscription-only / unpublished. */
  pricePerMTokens: number | null;
  /** LMSYS Chatbot Arena ELO (overall); null if not yet rated / not comparable. */
  arenaElo: number | null;
  /** Artificial Analysis Intelligence Index (~0-100); null if not rated. */
  qualityIndex: number | null;
  /** Artificial Analysis output speed (tokens/sec); null if not captured. */
  speedTps: number | null;
}

export const benchmarks: Record<string, BenchmarkEntry> = {
  chatgpt: {
    primaryModel: 'GPT-5.5',
    contextWindow: 400000,
    pricePerMTokens: 30,
    arenaElo: 1506,
    qualityIndex: 60,
    speedTps: 71,
  },
  codex: {
    primaryModel: 'GPT-5.5',
    contextWindow: 400000,
    pricePerMTokens: 30,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  claude: {
    primaryModel: 'Claude Opus 4.7',
    contextWindow: 1000000,
    pricePerMTokens: 25,
    arenaElo: 1503,
    qualityIndex: 57,
    speedTps: null,
  },
  'claude-code': {
    primaryModel: 'Claude Opus 4.7',
    contextWindow: 1000000,
    pricePerMTokens: null,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  cowork: {
    primaryModel: 'Claude Opus 4.7',
    contextWindow: 1000000,
    pricePerMTokens: null,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  gemini: {
    primaryModel: 'Gemini 3.5 Flash',
    contextWindow: 1000000,
    pricePerMTokens: 9,
    arenaElo: 1504,
    qualityIndex: 55,
    speedTps: 204,
  },
  grok: {
    primaryModel: 'Grok 4.3',
    contextWindow: 1000000,
    pricePerMTokens: 2.5,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  perplexity: {
    primaryModel: 'Sonar (Sonar Pro)',
    contextWindow: null,
    pricePerMTokens: 15,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  comet: {
    primaryModel: 'Perplexity Sonar (browser agent)',
    contextWindow: null,
    pricePerMTokens: null,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
  deepseek: {
    primaryModel: 'DeepSeek-V4',
    contextWindow: 1000000,
    pricePerMTokens: 0.28,
    arenaElo: 1467,
    qualityIndex: 52,
    speedTps: 140,
  },
  qwen: {
    primaryModel: 'Qwen3-Max',
    contextWindow: 262144,
    pricePerMTokens: null,
    arenaElo: 1443,
    qualityIndex: null,
    speedTps: null,
  },
  manus: {
    primaryModel: 'Manus 1.6 Max',
    contextWindow: null,
    pricePerMTokens: null,
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
  },
};

export function getBenchmark(toolId: string): BenchmarkEntry | null {
  return benchmarks[toolId] ?? null;
}
