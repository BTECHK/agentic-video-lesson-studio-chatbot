/**
 * Editorial "Best for X" picks — curated recommendations by use case.
 * 8 categories, each with a winner and runner-up from the 12 tracked tools.
 */

export interface EditorialPick {
  category: string;
  description: string;
  winnerId: string;
  winnerReason: string;
  runnerUpId: string;
  runnerUpReason: string;
}

export const editorialPicks: EditorialPick[] = [
  {
    category: 'Best for Writing',
    description: 'Long-form content, essays, copywriting, creative writing',
    winnerId: 'claude',
    winnerReason: 'Nuanced, well-structured prose with strong instruction following',
    runnerUpId: 'chatgpt',
    runnerUpReason: 'Versatile tone control and Canvas for collaborative editing',
  },
  {
    category: 'Best for Coding',
    description: 'Code generation, debugging, refactoring, technical architecture',
    winnerId: 'claude-code',
    winnerReason: 'Agentic coding with full codebase context and autonomous execution',
    runnerUpId: 'codex',
    runnerUpReason: 'Cloud-sandboxed coding agent with parallel task execution',
  },
  {
    category: 'Best for Research',
    description: 'Web search, source synthesis, fact-checking, academic research',
    winnerId: 'perplexity',
    winnerReason: 'Purpose-built for search with inline citations and source verification',
    runnerUpId: 'gemini',
    runnerUpReason: 'Deep Google Search integration with 1M token context for synthesis',
  },
  {
    category: 'Best for Reasoning',
    description: 'Complex analysis, math, logic puzzles, multi-step problem solving',
    winnerId: 'chatgpt',
    winnerReason: 'o-series reasoning models with extended thinking chains',
    runnerUpId: 'claude',
    runnerUpReason: 'Strong analytical depth with transparent reasoning process',
  },
  {
    category: 'Best for Speed',
    description: 'Fast responses, high throughput, real-time applications',
    winnerId: 'grok',
    winnerReason: 'Fastest inference speeds with competitive quality output',
    runnerUpId: 'gemini',
    runnerUpReason: 'Flash models deliver high speed at low cost',
  },
  {
    category: 'Best for Budget',
    description: 'Cost-effective for teams, generous free tiers, low API pricing',
    winnerId: 'deepseek',
    winnerReason: 'Near-frontier quality at 1/10th the cost of competitors',
    runnerUpId: 'qwen',
    runnerUpReason: 'Open-weight models with free self-hosting option',
  },
  {
    category: 'Best for Multimodal',
    description: 'Image understanding, generation, video, audio, document analysis',
    winnerId: 'gemini',
    winnerReason: 'Native multimodal with image/video/audio input and 1M context',
    runnerUpId: 'chatgpt',
    runnerUpReason: 'DALL-E image generation plus vision and file analysis',
  },
  {
    category: 'Best for Automation',
    description: 'Autonomous agents, multi-step tasks, tool orchestration',
    winnerId: 'manus',
    winnerReason: 'Purpose-built for autonomous multi-step task execution',
    runnerUpId: 'cowork',
    runnerUpReason: 'Background research agent with deep tool integration',
  },
];

export function getEditorialPicksForTool(toolId: string): EditorialPick[] {
  return editorialPicks.filter(
    (p) => p.winnerId === toolId || p.runnerUpId === toolId
  );
}
