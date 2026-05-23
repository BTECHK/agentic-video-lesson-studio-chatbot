import { describe, it, expect } from 'vitest';
import { wordsToCaptions, narrationToPages } from '../src/lib/captions';
import type { NarrationWord } from '../content/schemas/lesson';

const WORDS: NarrationWord[] = [
  { word: 'Hello', startMs: 0, endMs: 400 },
  { word: 'there', startMs: 400, endMs: 800 },
  { word: 'friend', startMs: 800, endMs: 1200 },
];

describe('wordsToCaptions', () => {
  it('maps each word to a space-prefixed Caption with a midpoint timestamp', () => {
    const caps = wordsToCaptions(WORDS);
    expect(caps).toHaveLength(3);
    expect(caps[0]).toEqual({
      text: ' Hello',
      startMs: 0,
      endMs: 400,
      timestampMs: 200,
      confidence: null,
    });
    expect(caps[1].timestampMs).toBe(600);
  });
});

describe('narrationToPages', () => {
  it('packs words into one page when total duration is within the window', () => {
    const pages = narrationToPages(WORDS, 2000);
    expect(pages).toHaveLength(1);
    expect(pages[0].text).toBe('Hello there friend');
    expect(pages[0].tokens).toHaveLength(3);
  });

  it('splits into multiple pages once a page exceeds the combine window', () => {
    // Window 600ms: page accrues until its span exceeds 600ms, then breaks.
    const pages = narrationToPages(WORDS, 600);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.map((p) => p.text).join(' ')).toBe('Hello there friend');
  });

  it('returns no pages for empty input', () => {
    expect(narrationToPages([], 1200)).toEqual([]);
  });
});
