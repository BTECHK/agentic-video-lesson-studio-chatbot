/**
 * Editorial "Best for X" picks — per-task recommendations across the 12 tools.
 *
 * Refreshed 2026-05-26 from the vendor-official + third-party feature research
 * (.planning/research/tool-feature-matrix.md). Key finding baked in: there is
 * NO single "best" model — aggregators disagree on #1 (Artificial Analysis ranks
 * GPT-5.5 top by intelligence index; LMArena's human-preference board put Claude
 * Opus #1) — so we recommend per task, not overall. `source` flags provenance.
 */

export type PickSource = 'vendor' | 'third-party' | 'mixed';

export interface EditorialPick {
  category: string;
  description: string;
  winnerId: string;
  winnerReason: string;
  runnerUpId: string;
  runnerUpReason: string;
  /** Where the call comes from: vendor docs, third-party benchmarks, or both. */
  source: PickSource;
}

/** Shown above the Best-For grid — the honest framing from the research. */
export const BEST_FOR_NOTE =
  "There's no single “best” AI — it depends on the task. These picks (May 2026) draw on " +
  'vendor docs plus third-party benchmarks (LMArena, Artificial Analysis); the aggregators ' +
  'themselves disagree on an overall #1, so we recommend per use case.';

export const editorialPicks: EditorialPick[] = [
  {
    category: 'Best for Writing',
    description: 'Long-form content, essays, copywriting, creative writing',
    winnerId: 'claude',
    winnerReason: 'Claude Opus 4.7 led LMArena’s human-preference text board; nuanced prose, strong instruction-following',
    runnerUpId: 'chatgpt',
    runnerUpReason: 'GPT-5.5 with Canvas for collaborative editing and versatile tone control',
    source: 'mixed',
  },
  {
    category: 'Best for Coding',
    description: 'Code generation, debugging, refactoring, agentic dev',
    winnerId: 'claude-code',
    winnerReason: 'Opus 4.7 tops SWE-bench Pro (~64%); full-codebase agentic edits, MCP, subagents',
    runnerUpId: 'codex',
    runnerUpReason: 'GPT-5.5; Terminal-Bench 2.0 82.7%, Goal mode + parallel worktrees',
    source: 'mixed',
  },
  {
    category: 'Best for Research',
    description: 'Web search, source synthesis, fact-checking, study answers',
    winnerId: 'perplexity',
    winnerReason: 'Answer engine with inline citations on every answer; real-time search, free tier',
    runnerUpId: 'gemini',
    runnerUpReason: 'Google grounding + 1M-token context for synthesis',
    source: 'vendor',
  },
  {
    category: 'Best for Reasoning',
    description: 'Complex analysis, math, logic, multi-step problem solving',
    winnerId: 'chatgpt',
    winnerReason: 'GPT-5.5 tops the Artificial Analysis Intelligence Index (May 2026)',
    runnerUpId: 'claude',
    runnerUpReason: 'Opus 4.7 close behind with transparent, step-by-step reasoning',
    source: 'third-party',
  },
  {
    category: 'Best for Speed',
    description: 'Fast responses, high throughput, real-time use',
    winnerId: 'gemini',
    winnerReason: 'Gemini 3.5 Flash is the measured output-speed leader (~204 tok/s, Artificial Analysis)',
    runnerUpId: 'grok',
    runnerUpReason: 'Grok 4.3 is fast and cheap ($2.50 / 1M output)',
    source: 'third-party',
  },
  {
    category: 'Best for Budget',
    description: 'Low cost, generous free tiers, open weights you can self-host',
    winnerId: 'deepseek',
    winnerReason: 'DeepSeek-V4 is open-weight (free self-host) + very cheap API; the app is free',
    runnerUpId: 'qwen',
    runnerUpReason: 'Qwen3 (Apache-2.0) self-hostable — a ~35B variant reportedly runs on one RTX 4090',
    source: 'mixed',
  },
  {
    category: 'Best for Multimodal',
    description: 'Image gen, video/audio understanding, document analysis',
    winnerId: 'gemini',
    winnerReason: 'Text/image/audio/video in, image gen (“Nano Banana”), Gemini Live voice',
    runnerUpId: 'chatgpt',
    runnerUpReason: 'ChatGPT Images 2.0 + vision + voice across all tiers',
    source: 'vendor',
  },
  {
    category: 'Best for Browser Automation',
    description: 'Acting on the web for you — clicking, forms, navigation',
    winnerId: 'comet',
    winnerReason: 'Perplexity’s AI browser, free worldwide; Comet Agent clicks, fills forms, navigates',
    runnerUpId: 'manus',
    runnerUpReason: 'Browser Operator runs in your logged-in sessions — supervise (reviewers note hallucinated clicks)',
    source: 'mixed',
  },
  {
    category: 'Best for Automation',
    description: 'Autonomous multi-step tasks, tool orchestration',
    winnerId: 'manus',
    winnerReason: 'One-shot autonomous task completion (slides/sites/apps) — powerful, but supervise',
    runnerUpId: 'cowork',
    runnerUpReason: 'Claude Desktop knowledge-work agent: Dispatch computer use + scheduled tasks',
    source: 'mixed',
  },
];

export function getEditorialPicksForTool(toolId: string): EditorialPick[] {
  return editorialPicks.filter(
    (p) => p.winnerId === toolId || p.runnerUpId === toolId
  );
}
