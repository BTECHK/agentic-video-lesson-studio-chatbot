import { describe, it, expect } from 'vitest';
import {
  analyzeFrame,
  renderLayoutGateMd,
  type FrameReport,
  type MeasuredEl,
} from '../src/lib/gate-layout';

// #73 — gate:layout pure analyzer. The DOM walker (LayoutProbe) produces
// MeasuredEl reports inside headless Chrome; these tests pin the geometry
// rules: no clipping, no out-of-safe-area text, no text-on-text overlap.

const VIDEO = { width: 1920, height: 1080 };
const SAFE = { x: 96, y: 54 };

function el(partial: Partial<MeasuredEl> & { i: number }): MeasuredEl {
  return {
    ancestors: [],
    tag: 'div',
    text: 'sample',
    textLeaf: true,
    decor: false,
    rect: { x: 200, y: 200, w: 400, h: 60 },
    clipped: false,
    ...partial,
  };
}

function frame(els: MeasuredEl[], f = 10): FrameReport {
  return { frame: f, els };
}

describe('clipping', () => {
  it('flags an element whose content overflows its clipped box', () => {
    const v = analyzeFrame(frame([el({ i: 0, clipped: true })]), VIDEO, SAFE);
    expect(v.some((x) => x.kind === 'clip')).toBe(true);
  });
  it('ignores decorative elements', () => {
    const v = analyzeFrame(frame([el({ i: 0, clipped: true, decor: true })]), VIDEO, SAFE);
    expect(v).toHaveLength(0);
  });
});

describe('safe area', () => {
  it('flags text that crosses the top safe inset (the quote-mark spill defect)', () => {
    const v = analyzeFrame(
      frame([el({ i: 0, rect: { x: 200, y: 10, w: 300, h: 80 } })]),
      VIDEO,
      SAFE,
    );
    expect(v.some((x) => x.kind === 'safe-area')).toBe(true);
  });
  it('flags text that runs off the right safe inset', () => {
    const v = analyzeFrame(
      frame([el({ i: 0, rect: { x: 1700, y: 200, w: 300, h: 60 } })]),
      VIDEO,
      SAFE,
    );
    expect(v.some((x) => x.kind === 'safe-area')).toBe(true);
  });
  it('passes text fully inside the safe box', () => {
    const v = analyzeFrame(frame([el({ i: 0 })]), VIDEO, SAFE);
    expect(v).toHaveLength(0);
  });
  it('does not apply to non-text containers', () => {
    const v = analyzeFrame(
      frame([el({ i: 0, textLeaf: false, text: '', rect: { x: 0, y: 0, w: 1920, h: 1080 } })]),
      VIDEO,
      SAFE,
    );
    expect(v).toHaveLength(0);
  });
});

describe('overlap', () => {
  it('flags two text leaves that materially intersect (the mark-on-eyebrow defect)', () => {
    const a = el({ i: 0, rect: { x: 200, y: 200, w: 400, h: 80 }, text: 'EYEBROW' });
    const b = el({ i: 1, rect: { x: 220, y: 230, w: 400, h: 200 }, text: '“' });
    const v = analyzeFrame(frame([a, b]), VIDEO, SAFE);
    expect(v.some((x) => x.kind === 'overlap')).toBe(true);
  });
  it('ignores ancestor/descendant pairs (nested text containers)', () => {
    const parent = el({ i: 0, rect: { x: 200, y: 200, w: 600, h: 300 } });
    const child = el({ i: 1, ancestors: [0], rect: { x: 220, y: 220, w: 200, h: 60 } });
    const v = analyzeFrame(frame([parent, child]), VIDEO, SAFE);
    expect(v.filter((x) => x.kind === 'overlap')).toHaveLength(0);
  });
  it('ignores tiny edge kisses below the threshold', () => {
    const a = el({ i: 0, rect: { x: 200, y: 200, w: 400, h: 60 } });
    const b = el({ i: 1, rect: { x: 200, y: 258, w: 400, h: 60 } }); // 2px graze
    const v = analyzeFrame(frame([a, b]), VIDEO, SAFE);
    expect(v.filter((x) => x.kind === 'overlap')).toHaveLength(0);
  });
  it('ignores decorative overlap (watermarks may sit behind text)', () => {
    const a = el({ i: 0 });
    const b = el({ i: 1, decor: true, rect: { x: 210, y: 210, w: 300, h: 50 } });
    const v = analyzeFrame(frame([a, b]), VIDEO, SAFE);
    expect(v.filter((x) => x.kind === 'overlap')).toHaveLength(0);
  });
});

describe('verdict markdown', () => {
  it('renders PASS with a machine-readable verdict line when clean', () => {
    const md = renderLayoutGateMd('topic-1-lesson-1', [10, 50], []);
    expect(md).toMatch(/^Verdict: PASS/m);
    expect(md).toContain('topic-1-lesson-1');
  });
  it('renders FIX and lists each violation when dirty', () => {
    const v = analyzeFrame(frame([el({ i: 0, clipped: true })], 42), VIDEO, SAFE);
    const md = renderLayoutGateMd('topic-1-lesson-1', [42], v);
    expect(md).toMatch(/^Verdict: FIX/m);
    expect(md).toContain('clip');
    expect(md).toContain('42');
  });
});
