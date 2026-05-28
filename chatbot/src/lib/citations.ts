import type { Citation } from './types';

export interface VerifiedCitation extends Citation {
  verified: boolean;
}

const CITATION_REGEX = /\[Source: ([^\]]+)\]/g;

export function parseCitations(content: string): { cleanContent: string; citations: Citation[] } {
  const citations: Citation[] = [];
  let index = 0;
  let match;

  while ((match = CITATION_REGEX.exec(content)) !== null) {
    const raw = match[1];
    const moduleMatch = raw.match(/Module\s+(\d+)/i);
    const lessonMatch = raw.match(/Lesson\s+(\d+)/i);
    const toolMatch = raw.match(/Tool:\s*(\w+)/i);
    citations.push({
      id: `cite-${index++}`,
      module: moduleMatch ? `Module ${moduleMatch[1]}` : 'General',
      lesson: lessonMatch ? `Lesson ${lessonMatch[1]}` : 'General',
      tool: toolMatch ? toolMatch[1] : undefined,
      snippet: raw,
    });
  }

  const cleanContent = content.replace(CITATION_REGEX, '').replace(/\s{2,}/g, ' ').trim();

  return { cleanContent, citations };
}

/**
 * Hallucination guard (Tutor invariant): drop any citation whose tool was not in
 * the retrieved set, so the UI never shows a source the model fabricated. Tool-less
 * (general module/lesson) citations are kept. Returns plain Citations for display.
 */
export function keepGroundedCitations(citations: Citation[], toolNames: string[]): Citation[] {
  const verified = verifyCitations(citations, toolNames);
  return citations.filter((_c, i) => verified[i].verified);
}

export function verifyCitations(citations: Citation[], toolNames: string[]): VerifiedCitation[] {
  const normalizedNames = toolNames.map((name) => name.toLowerCase());

  return citations.map((citation) => {
    if (!citation.tool) {
      return { ...citation, verified: true };
    }

    const verified = normalizedNames.includes(citation.tool.toLowerCase());
    if (!verified) {
      console.warn(`Unverified citation: tool "${citation.tool}" not found in content repository`);
    }

    return { ...citation, verified };
  });
}
