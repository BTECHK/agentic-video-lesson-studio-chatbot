import { describe, it, expect } from 'vitest';
import { BRAND, CAPTION, CHROME_INK } from '../src/brand/tokens';

// G1 / AC1 + AC2 — caption + chrome legibility, from the ACTUAL tokens. The
// hail-mary audit found inactive caption words (MUTED on a 0.55 chip) reading
// as washed-out/broken text and chrome (scene counter + inactive dots) failing
// WCAG. This asserts the fixed tokens clear WCAG from computed relative
// luminance — so it FAILS if anyone regresses a color/alpha back toward the
// old washed-out values.

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** Parse `rgba(28,28,28,0.7)` / `rgb(...)` into RGB + alpha (alpha defaults 1). */
function parseColor(c: string): { rgb: RGB; a: number } {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b, a] = m[1].split(',').map((s) => parseFloat(s.trim()));
    return { rgb: { r, g, b }, a: a === undefined ? 1 : a };
  }
  return { rgb: hexToRgb(c), a: 1 };
}

/** Composite a translucent foreground over an opaque background → opaque RGB. */
function over(fg: RGB, a: number, bg: RGB): RGB {
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}

function srgbToLin(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x relative luminance. */
function luminance({ r, g, b }: RGB): number {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}

/** WCAG contrast ratio between two opaque colors. */
function contrast(a: RGB, b: RGB): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

const bgBase = hexToRgb(BRAND.colors.bgBase);
const bgCard = hexToRgb(BRAND.colors.bgCard);

// The caption chip is bgBase RGB at CAPTION.chipAlpha over the scene's linen
// base — same hue, so the composite is bgBase; the alpha only matters when the
// chip floats over other content. Text sits on this composited chip.
const chip = over(bgBase, CAPTION.chipAlpha, bgBase);

describe('caption legibility (AC1)', () => {
  it('chip backing alpha is >= 0.8', () => {
    expect(CAPTION.chipAlpha).toBeGreaterThanOrEqual(0.8);
  });

  it('inactive words (CAPTION.ink) over the chip clear AAA (>= 7:1)', () => {
    const ink = parseColor(CAPTION.ink);
    expect(contrast(over(ink.rgb, ink.a, chip), chip)).toBeGreaterThanOrEqual(7.0);
  });

  it('active word (accent) over the chip clears AA (>= 4.5:1)', () => {
    const accent = parseColor(BRAND.colors.accent);
    expect(contrast(over(accent.rgb, accent.a, chip), chip)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('chrome legibility (AC2)', () => {
  it('scene counter clears AA (>= 4.5:1) over both card and linen base', () => {
    const counter = parseColor(CHROME_INK.counter);
    expect(contrast(over(counter.rgb, counter.a, bgCard), bgCard)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(over(counter.rgb, counter.a, bgBase), bgBase)).toBeGreaterThanOrEqual(4.5);
  });

  it('inactive pagination dots clear the non-text minimum (>= 3:1) over the base', () => {
    const dot = parseColor(CHROME_INK.dotInactive);
    expect(contrast(over(dot.rgb, dot.a, bgBase), bgBase)).toBeGreaterThanOrEqual(3.0);
  });
});

describe('regression guards (the old failing values must stay failing)', () => {
  it('textDim over the card is below AA — proves the counter fix is load-bearing', () => {
    const textDim = parseColor(BRAND.colors.textDim);
    expect(contrast(over(textDim.rgb, textDim.a, bgCard), bgCard)).toBeLessThan(4.5);
  });

  it('borderStrong over the base is below the non-text minimum — proves the dot fix is load-bearing', () => {
    const borderStrong = parseColor(BRAND.colors.borderStrong);
    expect(contrast(over(borderStrong.rgb, borderStrong.a, bgBase), bgBase)).toBeLessThan(3.0);
  });
});
