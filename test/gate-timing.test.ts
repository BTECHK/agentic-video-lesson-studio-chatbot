import { describe, it, expect } from 'vitest';
import { runTimingGate, renderTimingGateMd } from '../src/lib/gate-timing';

// Gate T — timing integrity. Tests cover all 5 verdict zones:
//   PASS:      75–120% of outlineSec
//   WARN-low:  60–74.9% of outlineSec
//   WARN-high: 120.1–130% of outlineSec
//   FAIL-low:  < 60% of outlineSec        → FIX
//   FAIL-high: > 130% of outlineSec       → FIX
//
// Baseline: outlineMinutes=5 → outlineSec=300
//   PASS:       225s – 360s  (75% – 120%)
//   WARN-low:   180s – 224s  (60% – <75%)
//   WARN-high:  361s – 390s  (>120% – 130%)
//   FAIL-low:   < 180s
//   FAIL-high:  > 390s

const BASE = { lessonId: 'topic-1-lesson-1', outlineMinutes: 5 }; // outlineSec = 300

describe('runTimingGate — verdict zones', () => {
  it('PASS: duration exactly at 75% lower bound', () => {
    const r = runTimingGate({ ...BASE, durationSec: 225 });
    expect(r.verdict).toBe('PASS');
    expect(r.outlineSec).toBe(300);
    expect(r.ratio).toBeCloseTo(0.75, 6);
  });

  it('PASS: duration exactly at 120% upper bound', () => {
    const r = runTimingGate({ ...BASE, durationSec: 360 });
    expect(r.verdict).toBe('PASS');
    expect(r.ratio).toBeCloseTo(1.2, 6);
  });

  it('PASS: duration comfortably inside the zone', () => {
    const r = runTimingGate({ ...BASE, durationSec: 280 });
    expect(r.verdict).toBe('PASS');
  });

  it('WARN: duration at 60% lower bound (WARN-low)', () => {
    const r = runTimingGate({ ...BASE, durationSec: 180 });
    expect(r.verdict).toBe('WARN');
    expect(r.ratio).toBeCloseTo(0.6, 6);
  });

  it('WARN: duration just below 75% (WARN-low boundary)', () => {
    // 224s = 74.67% — below 75%, above 60% → WARN
    const r = runTimingGate({ ...BASE, durationSec: 224 });
    expect(r.verdict).toBe('WARN');
  });

  it('WARN: duration just above 120% (WARN-high boundary)', () => {
    // 361s = 120.33% — above 120%, below 130% → WARN
    const r = runTimingGate({ ...BASE, durationSec: 361 });
    expect(r.verdict).toBe('WARN');
  });

  it('WARN: duration at 130% upper bound of WARN-high', () => {
    const r = runTimingGate({ ...BASE, durationSec: 390 });
    expect(r.verdict).toBe('WARN');
    expect(r.ratio).toBeCloseTo(1.3, 6);
  });

  it('FIX: duration below 60% (FAIL-low)', () => {
    // 179s = 59.67% — below 60% → FIX
    const r = runTimingGate({ ...BASE, durationSec: 179 });
    expect(r.verdict).toBe('FIX');
  });

  it('WARN: current typical lesson at 64% (typical sample lesson)', () => {
    // 115.648s against a 3-min outline = 64.2%
    // 64.2% is in WARN-low (60–75%), not FIX — below 60% is the FIX threshold
    const r = runTimingGate({ lessonId: 'topic-1-lesson-1', outlineMinutes: 3, durationSec: 115.648 });
    expect(r.verdict).toBe('WARN');
    expect(r.ratio).toBeCloseTo(115.648 / 180, 4);
  });

  it('FIX: duration below 60% of outline (e.g. a 2-min video against 8-min outline = 41.7%)', () => {
    // 200s / 480s = 41.7% → below 60% → FIX
    const r = runTimingGate({ lessonId: 'topic-1-lesson-2', outlineMinutes: 8, durationSec: 200 });
    expect(r.verdict).toBe('FIX');
  });

  it('FIX: duration above 130% (FAIL-high)', () => {
    // 391s = 130.33% — above 130% → FIX
    const r = runTimingGate({ ...BASE, durationSec: 391 });
    expect(r.verdict).toBe('FIX');
  });
});

describe('runTimingGate — output fields', () => {
  it('returns durationSec, outlineSec, ratio and artifactMd', () => {
    const r = runTimingGate({ ...BASE, durationSec: 250 });
    expect(r.durationSec).toBe(250);
    expect(r.outlineSec).toBe(300);
    expect(r.ratio).toBeCloseTo(250 / 300, 6);
    expect(typeof r.artifactMd).toBe('string');
    expect(r.artifactMd.length).toBeGreaterThan(0);
  });
});

describe('renderTimingGateMd', () => {
  it('first line is Verdict: PASS when verdict is PASS', () => {
    const md = renderTimingGateMd('topic-1-lesson-1', 280, 300, 'PASS');
    expect(md).toMatch(/^Verdict: PASS/);
  });

  it('first line is Verdict: WARN when verdict is WARN', () => {
    const md = renderTimingGateMd('topic-1-lesson-1', 190, 300, 'WARN');
    expect(md).toMatch(/^Verdict: WARN/);
  });

  it('first line is Verdict: FIX when verdict is FIX', () => {
    const md = renderTimingGateMd('topic-1-lesson-1', 100, 300, 'FIX');
    expect(md).toMatch(/^Verdict: FIX/);
  });

  it('contains the Gate T heading with lessonId', () => {
    const md = renderTimingGateMd('topic-1-lesson-2', 280, 300, 'PASS');
    expect(md).toContain('Gate T — Timing integrity · topic-1-lesson-2');
  });

  it('contains actual duration formatted as MmSs', () => {
    // 125s = 2m5s
    const md = renderTimingGateMd('topic-1-lesson-1', 125, 300, 'WARN');
    expect(md).toContain('2m5s');
    expect(md).toContain('125s');
  });

  it('contains outline target in minutes and seconds', () => {
    const md = renderTimingGateMd('topic-1-lesson-1', 280, 300, 'PASS');
    expect(md).toContain('5 min');
    expect(md).toContain('300s');
  });

  it('contains ratio formatted as a percentage with pass zone label', () => {
    const md = renderTimingGateMd('topic-1-lesson-1', 280, 300, 'PASS');
    expect(md).toMatch(/\d+\.\d+%/);
    expect(md).toContain('75–120%');
  });
});
