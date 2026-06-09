export const BRAND = {
  colors: {
    bgBase: '#EDE8E3',
    text: '#1C1C1C',
    accent: '#8B2635',
  },
  font: {
    family: 'Syne',
    weights: {
      regular: '400',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
    } as const,
  },
  radius: 4,
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

export type BrandColors = typeof BRAND.colors;
export type BrandFontWeights = typeof BRAND.font.weights;

/**
 * Leading (line-height) scale. Syne's tall display face collides below ~1.1
 * at display sizes (Gate C defect 2026-06-08: "overlap of lines" at 1.04),
 * so `display` is the floor for any multi-line title.
 */
export const LEADING = {
  display: 1.12,
  heading: 1.2,
  quote: 1.3,
  body: 1.45,
  caps: 1.1,
} as const;

/** 4px spacing scale — every gap/margin/padding is a multiple of this. */
export const SPACE_BASE = 4;
export const space = (n: number): number => n * SPACE_BASE;

/**
 * Safe-area inset (px, within 1920x1080): no text may cross this boundary.
 * ~5% insets; SceneFrame pads well inside it, so breaches mean real defects
 * (e.g. the oversized quote glyph escaping its box). Enforced by gate:layout.
 */
export const SAFE_AREA = { x: 96, y: 54 } as const;
