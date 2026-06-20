import { describe, it, expect } from 'vitest';
import { evaluateMedia, AUDIBLE_MAX_DB } from '../src/lib/gate-media';

// Gate M closes the two gaps that let the first v2 pass ship a silent sizzle and
// bt470bg-tagged (dull) video. Thresholds calibrated against real probes:
// real narration peaks ~-5dB; the silent placeholder peaked at -41.7dB.

describe('evaluateMedia', () => {
  it('passes audible BT.709 video', () => {
    const v = evaluateMedia({ hasAudioStream: true, maxDb: -5.5, colorSpace: 'bt709' });
    expect(v.verdict).toBe('PASS');
    expect(v.audioOk).toBe(true);
    expect(v.colorOk).toBe(true);
  });

  it('fails the silent-placeholder case (the shipped sizzle defect)', () => {
    const v = evaluateMedia({ hasAudioStream: true, maxDb: -41.7, colorSpace: 'bt709' });
    expect(v.verdict).toBe('FAIL');
    expect(v.audioOk).toBe(false);
    expect(v.reasons.join(' ')).toMatch(/silent/);
  });

  it('fails when there is no audio stream at all', () => {
    const v = evaluateMedia({ hasAudioStream: false, maxDb: null, colorSpace: 'bt709' });
    expect(v.verdict).toBe('FAIL');
    expect(v.reasons.join(' ')).toMatch(/no audio/);
  });

  it('fails the bt470bg color tag (the dull-video defect)', () => {
    const v = evaluateMedia({ hasAudioStream: true, maxDb: -5, colorSpace: 'bt470bg' });
    expect(v.verdict).toBe('FAIL');
    expect(v.colorOk).toBe(false);
    expect(v.reasons.join(' ')).toMatch(/bt709/);
  });

  it('treats the audible threshold as inclusive', () => {
    expect(evaluateMedia({ hasAudioStream: true, maxDb: AUDIBLE_MAX_DB, colorSpace: 'bt709' }).audioOk).toBe(true);
    expect(evaluateMedia({ hasAudioStream: true, maxDb: AUDIBLE_MAX_DB - 0.1, colorSpace: 'bt709' }).audioOk).toBe(false);
  });
});
