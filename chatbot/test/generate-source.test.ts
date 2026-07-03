import { describe, it, expect, vi } from 'vitest';

// `generate-source.ts` imports 'server-only', which throws outside a real
// Next.js server-component render. Stub it so vitest can import the module.
vi.mock('server-only', () => ({}));

const { getOutlineSummary } = await import('@/lib/generate-source');
const { listLessonIds } = await import('@/lib/lesson-timeline');

// The Generate page picks between two distinct empty states using exactly
// this pair of facts: does the lesson exist at all, and does it have an
// outline. Guard both facts so the page can keep telling them apart.
describe('Generate page empty-state facts', () => {
  it('distinguishes "lesson exists, no outline" (topic-3-lesson-1) from "no such lesson"', () => {
    const ids = listLessonIds();
    expect(ids).toContain('topic-3-lesson-1');
    expect(getOutlineSummary('topic-3-lesson-1')).toBeNull();
    expect(getOutlineSummary('not-a-real-lesson-id')).toBeNull();
    expect(ids.includes('not-a-real-lesson-id')).toBe(false);
  });

  it('returns a populated summary for a lesson with an outline.json', () => {
    const summary = getOutlineSummary('topic-1-lesson-1');
    expect(summary).not.toBeNull();
    expect(summary?.lessonId).toBe('topic-1-lesson-1');
    expect(summary?.sections.length).toBeGreaterThan(0);
  });
});
