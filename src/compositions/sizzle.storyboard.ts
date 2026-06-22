/**
 * sizzle.storyboard.ts — the CONTENT CONTRACT for the sizzle (promo) reel.
 *
 * SAMPLE CONTENT: this is neutral product-demo copy about the video pipeline
 * itself (outline in, finished video lesson out). It describes no real course,
 * audience or market.
 *
 * Single source of truth for the promo copy that has historically REGRESSED on
 * rebuilds: the "what it does / what it replaces" lists, the tool chips + brand
 * colors, the three transform columns, and the closing tagline. The
 * `SizzleManifesto` component renders FROM this object and holds no copy of its
 * own. To change wording or tools, edit HERE; the render follows.
 *
 * Companion prose: `sizzle.storyboard.md`.
 *
 * VERBATIM RULE: the strings below are canonical. `*…*` marks accent-emphasis
 * (rendered crimson by `renderAccented`). No em-dashes in on-screen strings.
 */

/** A tool chip: vendor name + the brand FILL its glyph is drawn in. */
export interface SizzleTool {
  name: string;
  /**
   * A solid hex (e.g. Claude `#D97757`) OR the sentinel `'gemini-gradient'`,
   * which `ColoredToolMark` maps to an inline blue→purple→pink `<linearGradient>`.
   */
  color: string;
}

/** One transform column: the old state, the new state, and what axis it is. */
export interface SizzleTransformCol {
  from: string;
  to: string;
  label: string;
}

export interface SizzleStoryboard {
  different: {
    /** "What it does": exactly 3, verbatim. The last one gets hero emphasis. */
    doItems: string[];
    /** "What it replaces": exactly 3, verbatim (each gets a strikethrough). */
    notItems: string[];
    /** Tool chips, left→right, each with its brand fill. */
    tools: SizzleTool[];
  };
  transform: {
    /** The 3 before→after columns of the dark payoff beat. */
    cols: SizzleTransformCol[];
    /** The closing line under the columns. `*…*` = accent emphasis. */
    tagline: string;
  };
  cta?: {
    /** Call-to-action line under the close beat. Em-dash forbidden: use a middot. */
    apply: string;
  };
}

/** Sentinel color that drives the Gemini blue→purple→pink gradient. */
export const GEMINI_GRADIENT = 'gemini-gradient';

export const SIZZLE: SizzleStoryboard = {
  different: {
    doItems: [
      'Render lessons *straight from data*',
      'Check every render with automated gates',
      'One brand system, every frame',
    ],
    notItems: ['Screen-recording marathons', 'Hand-edited timelines', 'Copy-pasted slide decks'],
    tools: [
      { name: 'Claude', color: '#D97757' },
      { name: 'ChatGPT', color: '#0f0f0f' },
      { name: 'Gemini', color: GEMINI_GRADIENT },
      { name: 'Perplexity', color: '#20B8CD' },
    ],
  },
  transform: {
    cols: [
      { from: 'Manual', to: 'Automated', label: 'How it gets made' },
      { from: 'One-off', to: 'Repeatable', label: 'How it scales' },
      { from: 'Unchecked', to: 'Gated', label: 'How it ships' },
    ],
    tagline: 'Turn a structured outline into a *finished, gate-checked video lesson.*',
  },
  cta: {
    apply: 'Demo build · sample content only',
  },
};
