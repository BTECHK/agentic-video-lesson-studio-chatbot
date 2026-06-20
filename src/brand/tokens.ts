export const BRAND = {
  colors: {
    // Surfaces — warm linen family. The v2 facelift leans on the *contrast*
    // between these (card-white floating on linen) for depth, not new hues.
    bgBase: '#EDE8E3', // default scene background (Soft Linen)
    bgAlt: '#F7F4F0', // alternating scenes (journey map, tools landscape)
    bgCard: '#FDFBF9', // chat windows, tool cards, table bg (Card White)
    bgDark: '#E3DED9', // table header rows, recap/dark surfaces (Deeper Linen)
    // Ink
    text: '#1C1C1C', // primary text (Charcoal)
    textMuted: 'rgba(28,28,28,0.60)', // sub-copy, helper text
    textDim: 'rgba(28,28,28,0.33)', // placeholder text in composers
    // Accent — crimson, the only chromatic color in the system.
    accent: '#8B2635',
    accentSoft: 'rgba(139,38,53,0.10)', // glow around active dots, soft fills
    // Lines
    border: 'rgba(28,28,28,0.08)', // card borders, table row dividers
    borderStrong: 'rgba(28,28,28,0.15)', // header dividers, inactive dots
  },
  font: {
    family: 'Syne',
    // Mono is used only for chrome captions (scrubber, scene counter, timers).
    // System mono stack — no bundled face needed at this tiny size.
    mono: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
    weights: {
      regular: '400',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
    } as const,
  },
  radius: 4,
  // Window/chat/voice cards soften to 14px; everything else stays 4px. No
  // in-between values (6/8/12) — those read "designer-ish but not designed".
  radiusWindow: 14,
  video: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
} as const;

export type BrandColors = typeof BRAND.colors;
export type BrandFontWeights = typeof BRAND.font.weights;

/**
 * Three-level shadow system — the depth that makes the v2 look "alive" vs the
 * flat 2D earlier pass. Charcoal at low opacity only; never glow, never a
 * saturated-color shadow. `window` is the floating-card depth used on chat
 * windows and desktop frames.
 */
export const SHADOW = {
  card: '0 4px 12px rgba(28,28,28,0.04)',
  cardHover: '0 12px 28px rgba(28,28,28,0.08)',
  window: '0 30px 60px -20px rgba(28,28,28,0.20), 0 8px 24px -8px rgba(28,28,28,0.08)',
} as const;

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
