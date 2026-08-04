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
    // Neutral fill behind a muted "Limited" capability cell (charcoal, no hue).
    limitedCellBg: 'rgba(28,28,28,0.06)',
  },
  font: {
    family: 'Syne',
    // Mono is used only for chrome captions (scrubber, scene counter, timers).
    // System mono stack — no bundled face needed at this tiny size.
    mono: '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
    weights: {
      regular: '400',
      medium: '500',
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
  // Slight lift for interactive atoms (buttons, the voice-demo mic). Charcoal at
  // low opacity only — replaces the saturated-crimson glow that violated the rule.
  button: '0 8px 20px rgba(28,28,28,0.10)',
} as const;

/**
 * Leading (line-height) scale. Syne's tall display face collides below ~1.1
 * at display sizes (Gate C defect 2026-06-08: "overlap of lines" at 1.04),
 * so `display` is the floor for any multi-line title.
 */
export const LEADING = {
  title: 1.02,
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

/**
 * Content-safe bottom clearance (px, distance from the frame's bottom edge):
 * the floor scene CONTENT (card stacks, checklists, transcripts) must stay
 * above so it never invades the persistent bottom chrome band — pagination
 * dots + scene counter (LessonChrome, `bottom: CAPTION_BOTTOM + 90 = 162`,
 * row height ~19px) plus a breathing margin. Distinct from `SAFE_AREA.y`
 * (a much smaller absolute-edge inset for stray text) — this is the taller
 * floor for the chrome band specifically. Vision-QC defect family (11+
 * lessons): comparison-chats composers, assignment-list callouts, and
 * setup-checklist rows landing on/under the dots and counter.
 */
export const CONTENT_SAFE_BOTTOM = 188;

/**
 * Motion durations (frames @ 30fps) — the v4 motion seam. `glide`/`pop` are
 * the values ALREADY hardcoded in `lesson-scenes/shared.tsx` (useGlideIn
 * dur=18/fromY=24, usePopIn DUR=16/back(1.6)) pulled up to tokens so v4 code
 * reads the same numbers rather than re-deriving them. `exit` is new: the
 * v4 scene-exit glide (SceneExitWrapper in LessonVideo.tsx) fades/lifts the
 * outgoing scene over its last `exit.dur` frames. `cursorTooltip` is the one
 * spring config shared by 2+ sites (ScreenFlow's MockCursor tooltip fade
 * in/out) — pulled up so those ad-hoc `{damping,mass}` literals read one token.
 */
export const MOTION = {
  glide: { dur: 18, fromY: 24 },
  pop: { dur: 16, overshoot: 1.6 },
  exit: { dur: 10, toY: -18 },
  cursorTooltip: { damping: 22, mass: 0.5 },
} as const;

/**
 * SceneAmbient's drifting/breathing warm-light constants, pulled up from the
 * inline literals in `lesson-scenes/shared.tsx` so v4 can retune per-profile
 * without touching the renderer. Values are byte-identical to the prior
 * inline constants — this is a pure token extraction, not a redesign.
 * Rates are rad/s (used as `Math.sin(t * rate)`) and MUST stay < 18.8 rad/s
 * (3 Hz) per WCAG 2.3.1 (photosensitivity — no flashing content).
 */
export const AMBIENT = {
  tint: { light: '139,38,53', dark: '231,166,174' },
  alpha: { light: [0.07, 0.05], dark: [0.12, 0.08] },
  breathRate: [0.6, 0.5],
  rippleRate: [3.1, 2.5],
  rippleAmp: 0.08,
  drift: [
    { x: 0.4, xAmp: 70, y: 0.33, yAmp: 48, pos: '82% 22%', size: 46 },
    { x: 0.3, xAmp: 84, y: 0.38, yAmp: 56, pos: '14% 86%', size: 40 },
  ],
} as const;

/**
 * Chrome (persistent UI) contrast tokens — LessonChrome's scene counter and
 * inactive pagination dots. Previous values failed WCAG: counter used
 * `textDim` (0.33 alpha) → ~2.06:1 against the linen base (small text needs
 * ≥4.5:1 with margin); inactive dots used `borderStrong` (0.15 alpha) →
 * ~1.35:1 (non-text UI needs ≥3:1 with margin). Counter 0.70 → ~5.72:1 on the
 * linen base; dots 0.52 → ~3.32:1 (≥3:1 with the required 0.2 margin).
 */
export const CHROME_INK = {
  counter: 'rgba(28,28,28,0.70)',
  dotInactive: 'rgba(28,28,28,0.52)',
} as const;

/**
 * Caption (LessonCaptions) legibility tokens. Inactive words previously used
 * `MUTED` (0.62 alpha charcoal) on a 0.55-alpha chip — read as washed-out to
 * the point of being mistaken for clipped/broken text (hail-mary audit). Full
 * charcoal ink + a stronger chip backing + a shorter entry fade fix this.
 */
export const CAPTION = {
  ink: '#1C1C1C',
  chipAlpha: 0.85,
  fadeMs: 100,
} as const;
