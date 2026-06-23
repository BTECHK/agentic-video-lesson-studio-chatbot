import { describe, it, expect } from 'vitest';
import { BRAND, LEADING, SAFE_AREA, SPACE_BASE, space, SHADOW } from '../src/brand/tokens';
import { sceneTitleStyle, sceneSubStyle, eyebrowStyle } from '../src/compositions/lesson-scenes/shared';
import { quoteStyles, QUOTE_MARKS } from '../src/compositions/lesson-scenes/QuoteCard';

// #72 — systematic typography/spacing/safe-area contracts. These are the
// design-system floors that prevented defects (title line collision, glyph
// overflow) from being component-local one-off fixes.

describe('spacing scale', () => {
  it('is a 4px base scale', () => {
    expect(SPACE_BASE).toBe(4);
    expect(space(1)).toBe(4);
    expect(space(3)).toBe(12);
    expect(space(10)).toBe(40);
  });
});

describe('leading scale', () => {
  it('keeps display leading above the Syne collision floor (defect: lineHeight 1.04)', () => {
    expect(LEADING.display).toBeGreaterThanOrEqual(1.1);
  });
  it('keeps body/quote leading readable', () => {
    expect(LEADING.body).toBeGreaterThanOrEqual(1.4);
    expect(LEADING.quote).toBeGreaterThanOrEqual(1.25);
  });
});

describe('safe area', () => {
  it('defines a positive inset inside the 1920x1080 frame', () => {
    expect(SAFE_AREA.x).toBeGreaterThan(0);
    expect(SAFE_AREA.y).toBeGreaterThan(0);
    expect(SAFE_AREA.x * 2).toBeLessThan(BRAND.video.width);
    expect(SAFE_AREA.y * 2).toBeLessThan(BRAND.video.height);
  });
});

describe('v2 surface + shadow system', () => {
  it('keeps card-white brighter than the linen base for depth contrast', () => {
    // #FDFBF9 (card) must be lighter than #EDE8E3 (base) or windows won't pop.
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    expect(lum(BRAND.colors.bgCard)).toBeGreaterThan(lum(BRAND.colors.bgBase));
    expect(lum(BRAND.colors.bgDark)).toBeLessThan(lum(BRAND.colors.bgBase));
  });
  it('only radius values are 4 and 14 — no slop values', () => {
    expect(BRAND.radius).toBe(4);
    expect(BRAND.radiusWindow).toBe(14);
  });
  it('exposes three charcoal-only shadow levels (no glow, no color)', () => {
    expect(SHADOW.window).toContain('rgba(28,28,28');
    expect(SHADOW.window).not.toMatch(/139,\s*38,\s*53/); // never accent-tinted
    expect(Object.keys(SHADOW)).toEqual(['card', 'cardHover', 'window']);
  });
});

describe('shared primitives consume the scales', () => {
  it('SceneTitle uses the title leading, not a hardcoded value', () => {
    expect(sceneTitleStyle(84).lineHeight).toBe(LEADING.title);
    expect(sceneTitleStyle(66).fontSize).toBe(66);
  });
  it('SceneSub uses the FV2 subtitle leading', () => {
    expect(sceneSubStyle().lineHeight).toBe(1.5);
  });
  it('Eyebrow uses the caps leading', () => {
    expect(eyebrowStyle().lineHeight).toBe(LEADING.caps);
  });
});

describe('QuoteCard typography (defects: orphan quote mark, glyph overflow)', () => {
  it('renders matched opening AND closing quote marks', () => {
    expect(QUOTE_MARKS.open).toBe('“');
    expect(QUOTE_MARKS.close).toBe('”');
  });
  it('quote text uses the quote leading from the scale', () => {
    expect(quoteStyles.quote.lineHeight).toBe(LEADING.quote);
  });
  it('has no fixed-height decorative glyph box (the overflow defect)', () => {
    // The orphan fontSize:200-into-height:90 mark is gone; quote marks are
    // inline and size intrinsically with the quote text.
    expect(quoteStyles).not.toHaveProperty('mark');
  });
});
