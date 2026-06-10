import type { Citation } from './types.js';

const CITATION_REGEX = /\[Source: ([^\]]+)\]/g;

export function parseCitations(content: string): { cleanContent: string; citations: Citation[] } {
  const citations: Citation[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(CITATION_REGEX);
  while ((match = re.exec(content)) !== null) {
    const raw = match[1];
    const m = raw.match(/Module\s+(\d+)/i);
    const l = raw.match(/Lesson\s+(\d+)/i);
    const t = raw.match(/Tool:\s*([\w-]+)/i);
    citations.push({
      module: m ? `Module ${m[1]}` : 'General',
      lesson: l ? `Lesson ${l[1]}` : 'General',
      tool: t ? t[1] : undefined,
      snippet: raw,
    });
  }
  const cleanContent = content.replace(CITATION_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  return { cleanContent, citations };
}

/**
 * Hallucination guard (the Tutor invariant): drop any citation whose tool was not
 * in the retrieved set, so a student is never shown a source the model fabricated.
 * Tool-less (general) citations are kept. This is a deterministic code control —
 * security does not live in the prompt.
 */
export function keepGroundedCitations(citations: Citation[], retrievedToolNames: string[]): Citation[] {
  const allowed = new Set(retrievedToolNames.map((n) => n.toLowerCase()));
  return citations.filter((c) => !c.tool || allowed.has(c.tool.toLowerCase()));
}
