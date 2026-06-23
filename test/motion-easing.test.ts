import { describe, it, expect } from 'vitest';
import { glideProgress } from '../src/compositions/lesson-scenes/shared';

// FV2-3 / AC3.2 — entrance helpers are explicit-duration eased tweens, not
// springs. The contract is HARD ARRIVAL: the glide must reach 1.0 by frame
// `delay + dur`. A spring asymptotes toward 1.0 and never gets there at d+Δ,
// so this test FAILS for the old spring()-based useGlideIn — which is the bug.

describe('glideProgress (eased, hard arrival)', () => {
  const delay = 16;
  const dur = 18;

  it('is 0 at frame === delay', () => {
    expect(glideProgress(delay, delay, dur)).toBeCloseTo(0, 5);
  });

  it('reaches 1.0 (≥0.999) at frame === delay + dur — a spring never would', () => {
    expect(glideProgress(delay + dur, delay, dur)).toBeGreaterThanOrEqual(0.999);
  });

  it('clamps before the start and after the end', () => {
    expect(glideProgress(delay - 5, delay, dur)).toBe(0);
    expect(glideProgress(delay + dur + 100, delay, dur)).toBe(1);
  });

  it('defaults dur to 18', () => {
    expect(glideProgress(18, 0)).toBeGreaterThanOrEqual(0.999);
  });
});
