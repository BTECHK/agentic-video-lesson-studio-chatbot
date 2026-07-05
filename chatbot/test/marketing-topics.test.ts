import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// `marketing-topics.ts` imports 'server-only', which throws outside a real
// Next.js server-component render. Stub it so vitest can import the module.
vi.mock('server-only', () => ({}));

const { getMarketingTopics } = await import('@/lib/marketing-topics');

// Ground truth: the course-map is the single source the marketing preview
// reads from. Load it the same way the helper resolves it (repo-root relative
// to the chatbot cwd) so the test fails if either drifts.
const courseMap = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), '..', 'content', 'curriculum', 'course-map.json'), 'utf-8'),
) as { topics: { number: number; lessons: { title: string }[] }[] };
const module1 = courseMap.topics.find((t) => t.number === 1)!;

describe('getMarketingTopics', () => {
  it('returns the first Module-1 lesson titles from course-map.json', () => {
    const topics = getMarketingTopics();
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.map((t) => t.title)).toEqual(
      module1.lessons.slice(0, topics.length).map((l) => l.title),
    );
  });

  it('defaults to the first five lessons with zero-padded ordinals', () => {
    const topics = getMarketingTopics();
    expect(topics).toHaveLength(5);
    expect(topics.map((t) => t.number)).toEqual(['01', '02', '03', '04', '05']);
    expect(topics[0].title).toBe(module1.lessons[0].title);
  });

  it('honours the limit argument', () => {
    expect(getMarketingTopics(3)).toHaveLength(3);
  });
});
