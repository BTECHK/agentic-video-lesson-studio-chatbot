import type { Citation } from './types';

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
