/**
 * Static benchmark data for AI tools.
 * Sources: LMSYS Chatbot Arena ELO (May 2025), Artificial Analysis (quality/speed/price).
 * No external API calls — all data is hardcoded snapshots.
 */

export interface BenchmarkEntry {
  /** LMSYS Chatbot Arena ELO rating (overall) */
  arenaElo: number | null;
  /** Artificial Analysis quality index (0-100) */
  qualityIndex: number | null;
  /** Artificial Analysis speed: output tokens per second */
  speedTps: number | null;
  /** Artificial Analysis price: $ per million output tokens */
  pricePerMTokens: number | null;
  /** Context window size in tokens */
  contextWindow: number;
  /** Primary model powering the tool */
  primaryModel: string;
}

/**
 * Benchmark data keyed by tool ID.
 * Values are approximate snapshots — not live data.
 */
export const benchmarks: Record<string, BenchmarkEntry> = {
  chatgpt: {
    arenaElo: 1290,
    qualityIndex: 82,
    speedTps: 90,
    pricePerMTokens: 10,
    contextWindow: 128000,
    primaryModel: 'GPT-4o',
  },
  claude: {
    arenaElo: 1285,
    qualityIndex: 85,
    speedTps: 78,
    pricePerMTokens: 15,
    contextWindow: 200000,
    primaryModel: 'Claude Sonnet 4',
  },
  'claude-code': {
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
    pricePerMTokens: null,
    contextWindow: 200000,
    primaryModel: 'Claude Sonnet 4',
  },
  gemini: {
    arenaElo: 1280,
    qualityIndex: 80,
    speedTps: 120,
    pricePerMTokens: 7,
    contextWindow: 1000000,
    primaryModel: 'Gemini 2.5 Pro',
  },
  grok: {
    arenaElo: 1210,
    qualityIndex: 72,
    speedTps: 140,
    pricePerMTokens: 5,
    contextWindow: 131072,
    primaryModel: 'Grok-3',
  },
  perplexity: {
    arenaElo: null,
    qualityIndex: 75,
    speedTps: 95,
    pricePerMTokens: 5,
    contextWindow: 128000,
    primaryModel: 'Sonar Large',
  },
  deepseek: {
    arenaElo: 1270,
    qualityIndex: 78,
    speedTps: 60,
    pricePerMTokens: 2,
    contextWindow: 128000,
    primaryModel: 'DeepSeek-V3',
  },
  qwen: {
    arenaElo: 1250,
    qualityIndex: 76,
    speedTps: 65,
    pricePerMTokens: 2,
    contextWindow: 131072,
    primaryModel: 'Qwen3-235B',
  },
  codex: {
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
    pricePerMTokens: null,
    contextWindow: 192000,
    primaryModel: 'codex-1',
  },
  comet: {
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
    pricePerMTokens: null,
    contextWindow: 128000,
    primaryModel: 'Comet (Opaque)',
  },
  cowork: {
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
    pricePerMTokens: null,
    contextWindow: 200000,
    primaryModel: 'Claude (Anthropic)',
  },
  manus: {
    arenaElo: null,
    qualityIndex: null,
    speedTps: null,
    pricePerMTokens: null,
    contextWindow: 128000,
    primaryModel: 'Multi-model orchestration',
  },
};

export function getBenchmark(toolId: string): BenchmarkEntry | null {
  return benchmarks[toolId] ?? null;
}
