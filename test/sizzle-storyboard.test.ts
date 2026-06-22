import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

/**
 * Locks the sizzle content contract (`sizzle.storyboard.ts`) and proves it
 * actually DRIVES the render. The regressions that kept recurring (a dropped 3rd
 * transform column, a lost tagline, changed copy, monochrome icons) each fail a
 * test here.
 *
 * Remotion is mocked to plain hooks/elements so the beat components render to a
 * static HTML string in a node test (no browser, no real video config).
 */
vi.mock('remotion', () => {
  const Pass = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) =>
    React.createElement('div', { style }, children);
  return {
    AbsoluteFill: Pass,
    Sequence: Pass,
    Audio: () => null,
    staticFile: (p: string) => p,
    useCurrentFrame: () => 120,
    useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080 }),
    interpolate: (input: number, _i: number[], output: number[]) => output[output.length - 1],
    spring: () => 1,
    Easing: {
      out: (fn?: (t: number) => number) => fn ?? ((t: number) => t),
      cubic: (t: number) => t,
      back: () => (t: number) => t,
    },
  };
});

import { SIZZLE, type SizzleStoryboard } from '../src/compositions/sizzle.storyboard';
import { TOOL_GLYPH_D, ColoredToolMark } from '../src/compositions/ColoredToolMark';
import { Different, Transform, Promise as PromiseBeat, Master } from '../src/compositions/SizzleManifesto';

// ── (a) structural — the invariants that regressed ──────────────────────────
describe('SIZZLE storyboard — structure', () => {
  it('has exactly 3 transform columns', () => {
    expect(SIZZLE.transform.cols.length).toBe(3);
  });

  it('keeps every transform column verbatim (incl. the 3rd)', () => {
    expect(SIZZLE.transform.cols[0]).toEqual({ from: 'Manual', to: 'Automated', label: 'How it gets made' });
    expect(SIZZLE.transform.cols[1]).toEqual({ from: 'One-off', to: 'Repeatable', label: 'How it scales' });
    expect(SIZZLE.transform.cols[2]).toEqual({ from: 'Unchecked', to: 'Gated', label: 'How it ships' });
  });

  it('has a non-empty tagline', () => {
    expect(SIZZLE.transform.tagline.trim().length).toBeGreaterThan(0);
    expect(SIZZLE.transform.tagline).toBe('Turn a structured outline into a *finished, gate-checked video lesson.*');
  });

  it('has 3 do-items and 3 not-items', () => {
    expect(SIZZLE.different.doItems).toHaveLength(3);
    expect(SIZZLE.different.notItems).toHaveLength(3);
  });

  it('gives every tool a {name,color}', () => {
    expect(SIZZLE.different.tools.length).toBeGreaterThan(0);
    for (const t of SIZZLE.different.tools) {
      expect(typeof t.name).toBe('string');
      expect(t.name.length).toBeGreaterThan(0);
      expect(typeof t.color).toBe('string');
      expect(t.color.length).toBeGreaterThan(0);
    }
  });

  it('uses the canonical copy, never the retired draft strings', () => {
    expect(SIZZLE.different.doItems).toEqual([
      'Render lessons *straight from data*',
      'Check every render with automated gates',
      'One brand system, every frame',
    ]);
    expect(SIZZLE.different.notItems).toEqual([
      'Screen-recording marathons',
      'Hand-edited timelines',
      'Copy-pasted slide decks',
    ]);
    const flat = JSON.stringify(SIZZLE);
    expect(flat).not.toContain('Scripts, scenes and voice in one pass');
    expect(flat).not.toContain('Videos that build themselves');
    expect(flat).not.toMatch(/TODO|lorem ipsum/i);
  });

  it('has a non-empty call-to-action line', () => {
    expect(SIZZLE.cta?.apply.trim().length ?? 0).toBeGreaterThan(0);
  });
});

// ── (b) distinct-glyph — the four `d` strings are pairwise different ─────────
describe('ColoredToolMark — distinct glyphs', () => {
  it('the four tool glyph `d` strings are pairwise different', () => {
    const ds = SIZZLE.different.tools.map((t) => {
      const key = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return TOOL_GLYPH_D[key];
    });
    expect(ds).toHaveLength(4);
    expect(ds.every((d) => typeof d === 'string' && d.length > 0)).toBe(true);
    expect(new Set(ds).size).toBe(ds.length); // all unique
  });

  it('renders a `d` path-string per tool, all distinct, in the SVG output', () => {
    const ds = SIZZLE.different.tools.map((t) => {
      const html = renderToStaticMarkup(React.createElement(ColoredToolMark, { name: t.name, color: t.color }));
      const m = html.match(/ d="([^"]+)"/);
      expect(m, `no path d for ${t.name}`).not.toBeNull();
      return m![1];
    });
    expect(new Set(ds).size).toBe(ds.length);
  });

  it('fills Gemini with a gradient and the others with their solid color', () => {
    const gemini = renderToStaticMarkup(React.createElement(ColoredToolMark, { name: 'Gemini', color: 'gemini-gradient' }));
    expect(gemini).toContain('linearGradient');
    const claude = renderToStaticMarkup(React.createElement(ColoredToolMark, { name: 'Claude', color: '#D97757' }));
    expect(claude).toContain('#D97757');
    expect(claude).not.toContain('linearGradient');
  });
});

// ── (c) mutation — the storyboard drives the render (AC6b) ───────────────────
function mutate(): SizzleStoryboard {
  return {
    different: {
      doItems: ['ZZ_MUTATED_DO', SIZZLE.different.doItems[1], SIZZLE.different.doItems[2]],
      notItems: SIZZLE.different.notItems,
      tools: SIZZLE.different.tools,
    },
    transform: {
      cols: [
        { from: 'ZZ_MUTATED_FROM', to: 'ZZ_MUTATED_TO', label: SIZZLE.transform.cols[0].label },
        SIZZLE.transform.cols[1],
        SIZZLE.transform.cols[2],
      ],
      tagline: 'ZZ_MUTATED_TAGLINE',
    },
  };
}

describe('storyboard drives the render (mutation)', () => {
  it('Different renders the mutated do-item, not the original', () => {
    const m = mutate();
    const out = renderToStaticMarkup(React.createElement(Different, { sb: m }));
    expect(out).toContain('ZZ_MUTATED_DO');
    expect(out).not.toContain('straight from data');
    expect(out).not.toContain(SIZZLE.different.doItems[0].replace(/\*/g, ''));
  });

  it('Different with the real storyboard shows every do/not item and tool', () => {
    const out = renderToStaticMarkup(React.createElement(Different, {}));
    expect(out).toContain('straight from data');
    for (const s of [...SIZZLE.different.doItems.slice(1), ...SIZZLE.different.notItems]) expect(out).toContain(s);
    for (const t of SIZZLE.different.tools) expect(out).toContain(t.name);
  });

  it('Transform renders the mutated column + tagline, not the originals', () => {
    const m = mutate();
    const out = renderToStaticMarkup(React.createElement(Transform, { sb: m }));
    expect(out).toContain('ZZ_MUTATED_FROM');
    expect(out).toContain('ZZ_MUTATED_TO');
    expect(out).toContain('ZZ_MUTATED_TAGLINE');
    expect(out).not.toContain('Manual');
    expect(out).not.toContain('Automated');
    expect(out).not.toContain('structured outline');
  });

  it('Transform with the real storyboard shows the 3rd column + tagline', () => {
    const out = renderToStaticMarkup(React.createElement(Transform, {}));
    expect(out).toContain('Unchecked');
    expect(out).toContain('Gated');
    expect(out).toContain('How it ships');
    expect(out).toContain('structured outline');
    expect(out).toContain('gate-checked video lesson');
  });
});

// ── (d) no AI tells — zero em-dashes in on-screen text (AC3b) ────────────────
describe('no em-dashes in on-screen text (AC3b)', () => {
  const EM = '—'; // em-dash

  it('the storyboard contains no em-dash', () => {
    const strings: string[] = [
      ...SIZZLE.different.doItems,
      ...SIZZLE.different.notItems,
      ...SIZZLE.different.tools.map((t) => t.name),
      ...SIZZLE.transform.cols.flatMap((c) => [c.from, c.to, c.label]),
      SIZZLE.transform.tagline,
      SIZZLE.cta?.apply ?? '',
    ];
    for (const s of strings) expect(s, `em-dash in: ${s}`).not.toContain(EM);
  });

  it('no rendered on-screen beat emits an em-dash', () => {
    const beats: Array<[string, React.FC]> = [
      ['Promise', PromiseBeat],
      ['Different', Different as React.FC],
      ['Master', Master],
      ['Transform', Transform as React.FC],
    ];
    for (const [name, Beat] of beats) {
      const out = renderToStaticMarkup(React.createElement(Beat));
      expect(out, `${name} emitted an em-dash`).not.toContain(EM);
    }
  });
});

// ── (e) sample copy — the hardcoded beats carry the pipeline-demo copy ────────
describe('hardcoded beats carry the sample pipeline copy', () => {
  it('Promise pitches the pipeline (outline in, video lesson out)', () => {
    const out = renderToStaticMarkup(React.createElement(PromiseBeat));
    expect(out).toContain('What the pipeline does');
    expect(out).toContain('finished video lesson');
  });

  it('Master lists the pipeline stages, first to last', () => {
    const out = renderToStaticMarkup(React.createElement(Master));
    expect(out).toContain('What the pipeline handles');
    const first = out.indexOf('Outline in');
    const last = out.indexOf('Publish-ready MP4');
    expect(first).toBeGreaterThan(-1);
    expect(last).toBeGreaterThan(first);
  });
});
