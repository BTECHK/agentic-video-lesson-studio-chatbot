import type { ToolData } from './content-types';

export interface ContentContext {
  tools: ToolData[];
  query: string;
}

function defaultToolLoader(): ToolData[] {
  // Dynamic require avoids "server-only" import at module load time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAllTools } = require('./content');
  return getAllTools();
}

export function findRelevantContent(
  message: string,
  toolLoader: () => ToolData[] = defaultToolLoader
): ContentContext {
  const tools = toolLoader();
  const normalized = message.toLowerCase();

  const scored = tools
    .map((tool) => {
      let score = 0;

      // Tool name match (weight: 10)
      if (normalized.includes(tool.name.toLowerCase())) {
        score += 10;
      }

      // Vendor name match (weight: 8)
      if (normalized.includes(tool.vendor.toLowerCase())) {
        score += 8;
      }

      // Tool id match (weight: 10)
      if (normalized.includes(tool.id.toLowerCase())) {
        score += 10;
      }

      // Capability category match where supported (weight: 5)
      for (const [key, cap] of Object.entries(tool.capabilities)) {
        if (cap.supported && normalized.includes(key.toLowerCase())) {
          score += 5;
        }
      }

      // Description word match (words > 4 chars, weight: 1 per match)
      const descWords = tool.description
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
      for (const word of descWords) {
        if (word && normalized.includes(word)) {
          score += 1;
        }
      }

      return { tool, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    tools: scored.map((entry) => entry.tool),
    query: message,
  };
}

export function formatContentForPrompt(tools: ToolData[]): string {
  if (tools.length === 0) return '';

  return tools
    .map((tool) => {
      const header = `### ${tool.name} (${tool.vendor})`;
      const desc = tool.description;
      const url = `URL: ${tool.url}`;
      const priority = `Priority: ${tool.priority}`;

      const supportedCaps = Object.entries(tool.capabilities)
        .filter(([, cap]) => cap.supported)
        .map(([key, cap]) => {
          let line = `- ${key}: ${cap.summary}`;
          if (cap.limitations.length > 0) {
            line += `\n  Limitations: ${cap.limitations.join('; ')}`;
          }
          return line;
        });

      const capsSection =
        supportedCaps.length > 0
          ? `\nCapabilities:\n${supportedCaps.join('\n')}`
          : '';

      return `${header}\n${desc}\n${url}\n${priority}${capsSection}`;
    })
    .join('\n\n');
}
