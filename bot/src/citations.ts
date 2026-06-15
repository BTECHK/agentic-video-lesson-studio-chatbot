import type { Citation, ToolData } from './types.js';

/**
 * Strip any source/tool markup the model emitted into prose, then tidy the
 * artifacts stripping leaves behind. The model is now TOLD not to write these
 * (sources are added deterministically from the retrieved set), so this is the
 * defensive backstop that guarantees a student never sees leaked "[Source: …]"
 * or "(Tool: …)" syntax — the exact thing that read as broken output before.
 */
export function stripSourceMarkup(content: string): string {
  return content
    .replace(/\[Source:[^\]]*\]/gi, '')
    .replace(/\[Tool:[^\]]*\]/gi, '')
    .replace(/\((?:Tool|Source):[^)]*\)/gi, '')
    .replace(/[ \t]+([.,;:!?])/g, '$1') // fix the " ." a stripped tag leaves
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The grounded sources to display: the retrieved tools the answer actually names.
 * Built from the retrieved set (never from model text), so the Tutor invariant —
 * never show a source the model fabricated — holds by construction. Longer tool
 * names win over substrings (e.g. "Claude Code" suppresses a bare "Claude" match).
 */
export function groundedSources(answer: string, retrieved: ToolData[]): Citation[] {
  const lower = answer.toLowerCase();
  const named = retrieved.filter((t) => lower.includes(t.name.toLowerCase()));
  const sorted = [...named].sort((a, b) => b.name.length - a.name.length);
  const kept: ToolData[] = [];
  for (const t of sorted) {
    if (!kept.some((k) => k.name.toLowerCase().includes(t.name.toLowerCase()))) kept.push(t);
  }
  // Preserve retrieval (relevance) order in the output.
  return retrieved
    .filter((t) => kept.includes(t))
    .map((t) => ({ module: 'General', lesson: 'General', tool: t.name, snippet: t.name }));
}
