import type { ToolData } from './types.js';

/**
 * Keyword retrieval over the curated tool set — mirrors the proven console
 * scoring (name/vendor/id heavy, capability + description light). Sufficient
 * for the ~12-tool corpus; swap for embeddings behind this same signature when
 * RAG-over-lessons lands.
 */
export function findRelevantTools(message: string, tools: ToolData[], limit = 5): ToolData[] {
  const normalized = message.toLowerCase();
  return tools
    .map((tool) => {
      let score = 0;
      if (normalized.includes(tool.name.toLowerCase())) score += 10;
      if (normalized.includes(tool.vendor.toLowerCase())) score += 8;
      if (normalized.includes(tool.id.toLowerCase())) score += 10;
      for (const [key, cap] of Object.entries(tool.capabilities ?? {})) {
        if (cap.supported && normalized.includes(key.toLowerCase())) score += 5;
      }
      for (const w of tool.description.split(/\s+/)) {
        const word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (word.length > 4 && normalized.includes(word)) score += 1;
      }
      return { tool, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e) => e.tool);
}

export function formatToolsForPrompt(tools: ToolData[]): string {
  if (tools.length === 0) return '';
  return tools
    .map((tool) => {
      const caps = Object.entries(tool.capabilities ?? {})
        .filter(([, c]) => c.supported)
        .map(([key, c]) => {
          let line = `- ${key}: ${c.summary ?? ''}`.trimEnd();
          if (c.limitations?.length) line += `\n  Limitations: ${c.limitations.join('; ')}`;
          return line;
        });
      const capsSection = caps.length ? `\nCapabilities:\n${caps.join('\n')}` : '';
      return `### ${tool.name} (${tool.vendor})\n${tool.description}\nURL: ${tool.url}${capsSection}`;
    })
    .join('\n\n');
}
