import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// --- Prompt generation for Claude Code passthrough (D-02) ---

export function generateExtractionPrompt(
  url: string,
  toolId: string,
  currentToolData: Record<string, unknown>,
): string {
  const schemaFields = [
    'id', 'name', 'vendor', 'priority', 'description', 'url',
    'capabilities', 'sourceRefs',
  ];

  return `# Content Extraction Request

## Source URL
${url}

## Target Tool
\`${toolId}\`

## Current Data
\`\`\`json
${JSON.stringify(currentToolData, null, 2)}
\`\`\`

## Schema Fields
The extracted data must conform to these fields:
${schemaFields.map((f) => `- \`${f}\``).join('\n')}

## Instructions
1. Visit the URL above and extract current information about this AI tool.
2. Compare with the current data and identify what has changed.
3. Return ONLY a JSON object with the updated fields (not unchanged fields).
4. Wrap the JSON in a \`\`\`json code block.
5. If nothing has changed, return an empty object: \`{}\`
`;
}

// --- Response parsing ---

export function parseExtractionResponse(
  response: string,
): Record<string, unknown> | null {
  // Try to extract JSON from ```json blocks
  const fencedMatch = response.match(/```json\s*\n?([\s\S]*?)```/);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      return null;
    }
  }

  // Try raw JSON parse
  const trimmed = response.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  return null;
}

// --- Pending prompt writer ---

export function writePendingPrompt(toolId: string, prompt: string): string {
  const logDir = join(import.meta.dirname!, '..', '..', 'logs', 'ingest');
  mkdirSync(logDir, { recursive: true });
  const filePath = join(logDir, `pending-${toolId}.md`);
  writeFileSync(filePath, prompt, 'utf-8');
  return filePath;
}
