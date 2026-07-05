import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { quoteRevealCount } from '../src/compositions/lesson-scenes/QuoteCard';
import { coverVariant } from '../src/compositions/lesson-scenes/Cover';

// G2 / AC5 — the v4 scene-behavior seam is unit-testable via its two pure
// functions: QuoteCard's word-synced reveal count and Cover's per-topic variant
// picker. v3 behavior is unchanged (both are gated on useMotionProfile()==='v4'
// inside the components); these tests pin only the v4 math so a regression that
// breaks the reveal timing or flattens every cover to one variant goes RED.

describe('quoteRevealCount — word-synced progressive reveal', () => {
  const LAST = 10_000; // lastWordEndMs
  const N = 12; // quote word count

  it('reveals 0 words at the start (progress 0)', () => {
    expect(quoteRevealCount(0, LAST, N)).toBe(0);
  });

  it('reveals ceil(half) words at the midpoint (progress 0.5)', () => {
    // 0.5 * 12 = 6 → ceil = 6
    expect(quoteRevealCount(LAST / 2, LAST, N)).toBe(Math.ceil(0.5 * N));
    // an odd count rounds UP (ceil), never leaving a word half-shown
    expect(quoteRevealCount(LAST / 2, LAST, 11)).toBe(Math.ceil(0.5 * 11));
  });

  it('reveals all words once progress hits 1', () => {
    expect(quoteRevealCount(LAST, LAST, N)).toBe(N);
  });

  it('clamps: negative/overshoot elapsed stays in [0, N]', () => {
    expect(quoteRevealCount(-5_000, LAST, N)).toBe(0);
    expect(quoteRevealCount(LAST * 3, LAST, N)).toBe(N);
  });

  it('is monotonic non-decreasing in elapsed time', () => {
    let prev = -1;
    for (let ms = 0; ms <= LAST; ms += 250) {
      const count = quoteRevealCount(ms, LAST, N);
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });

  it('degenerate inputs reveal everything (never a permanent blank)', () => {
    expect(quoteRevealCount(0, 0, N)).toBe(N); // no timings
    expect(quoteRevealCount(1_000, LAST, 0)).toBe(0); // empty quote
  });
});

// Real cover eyebrow strings pulled from content/lessons/*/lesson.json — the
// picker must be deterministic AND actually spread these across all 4 buckets
// (a picker that collapses to one variant defeats the per-topic point).
function realCoverEyebrows(): string[] {
  const dir = path.join(__dirname, '..', 'content', 'lessons');
  const eyebrows: string[] = [];
  for (const d of fs.readdirSync(dir)) {
    const f = path.join(dir, d, 'lesson.json');
    if (!fs.existsSync(f)) continue;
    let j: { scenes?: Array<{ type: string; content?: { eyebrow?: string } }> };
    try {
      j = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      continue;
    }
    const cover = (j.scenes ?? []).find((s) => s.type === 'cover');
    const eyebrow = cover?.content?.eyebrow;
    if (typeof eyebrow === 'string') eyebrows.push(eyebrow);
  }
  return eyebrows;
}

describe('coverVariant — deterministic per-topic picker', () => {
  it('is deterministic for a given topic string', () => {
    const s = 'Topic 1 · Lesson 1.1';
    expect(coverVariant(s)).toBe(coverVariant(s));
  });

  it('always returns 0–3', () => {
    for (const e of realCoverEyebrows()) {
      const v = coverVariant(e);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  it('spreads four real topic strings across all four variants', () => {
    // Four real cover eyebrows that each land on a distinct bucket — proves the
    // char-code-sum mod 4 actually varies, not just returns 0.
    const cases: Array<[string, 0 | 1 | 2 | 3]> = [
      ['Topic 1 · Lesson 1.2', 0],
      ['Topic 1 · Lesson 1.3', 1],
      ['Topic 1 · Lesson 1.4', 2],
      ['Topic 1 · Lesson 1.1', 3],
    ];
    for (const [topic, expected] of cases) {
      expect(coverVariant(topic), topic).toBe(expected);
    }
    expect(new Set(cases.map(([, v]) => v)).size).toBe(4);
  });

  it('the real cover set touches every variant (0,1,2,3)', () => {
    const seen = new Set(realCoverEyebrows().map(coverVariant));
    expect(seen).toEqual(new Set([0, 1, 2, 3]));
  });
});
