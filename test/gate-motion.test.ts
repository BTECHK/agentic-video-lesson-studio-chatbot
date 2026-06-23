import { describe, it, expect } from 'vitest';
import {
  evaluateMotion,
  FROZEN_THRESHOLD,
  MIN_ACTIVE_PCT,
  MAX_FROZEN_RUN_SEC,
} from '../src/lib/gate-motion';

const ACTIVE = FROZEN_THRESHOLD * 4; // a sample that clearly counts as "changed"

describe('evaluateMotion', () => {
  it('passes a lively clip (every sample shows change)', () => {
    const diffs = Array.from({ length: 130 }, () => ACTIVE);
    expect(evaluateMotion({ diffs, sampleFps: 2 }).verdict).toBe('PASS');
  });

  it('fails a slideshow (long frozen holds between cuts)', () => {
    // 6 beats: a spike at each cut, then a frozen hold longer than the limit.
    const frozenSamples = Math.ceil(MAX_FROZEN_RUN_SEC * 2) + 4;
    const diffs: number[] = [];
    for (let b = 0; b < 6; b++) {
      diffs.push(0.05);
      for (let i = 0; i < frozenSamples; i++) diffs.push(0);
    }
    const v = evaluateMotion({ diffs, sampleFps: 2 });
    expect(v.verdict).toBe('FAIL');
    expect(v.reasons.join(' ')).toMatch(/frozen/);
  });

  it('fails a too-static clip even when no single freeze is long', () => {
    // Two frozen then one active, repeating: frozen runs stay short (1s) but only
    // a third of frames change — isolates the activePct failure path.
    const diffs: number[] = [];
    for (let i = 0; i < 33; i++) diffs.push(0, 0, ACTIVE);
    const r = evaluateMotion({ diffs, sampleFps: 2 });
    expect(r.verdict).toBe('FAIL');
    expect(r.reasons.join(' ')).toMatch(/static/);
    expect(r.longestFrozenRunSec).toBeLessThanOrEqual(MAX_FROZEN_RUN_SEC);
    expect(r.activePct).toBeLessThan(MIN_ACTIVE_PCT);
  });

  it('fails when there are no samples', () => {
    expect(evaluateMotion({ diffs: [], sampleFps: 2 }).verdict).toBe('FAIL');
  });
});
