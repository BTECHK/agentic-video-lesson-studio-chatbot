import { describe, it, expect } from 'vitest';
import { quoteRevealCount } from '../src/compositions/lesson-scenes/QuoteCard';

// G2 / AC5 — the v4 QuoteCard word-synced reveal is unit-testable via its pure
// count function. v3 behavior is unchanged (gated on useMotionProfile()==='v4'
// inside the component); this pins only the v4 math so a regression that breaks
// the reveal timing goes RED.
//
// (Per-topic Cover variants were prototyped alongside this but held back from
// ship — content-height-unaware overflow, see Cover.tsx — so coverVariant() and
// its tests were removed with that code.)

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
