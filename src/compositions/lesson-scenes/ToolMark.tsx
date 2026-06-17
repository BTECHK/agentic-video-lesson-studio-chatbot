import React from 'react';
import { BRAND } from './shared';

/**
 * Distinct, on-brand monochrome mark per AI tool. Replaces `name.charAt(0)`,
 * which rendered ChatGPT and Claude as the same "C". Glyphs are simple geometric
 * marks (not exact vendor logos) so they stay on the linen/crimson brand and read
 * as distinct at a glance; unknown tools fall back to a clean two-letter monogram.
 * Inherits `currentColor` so it works on either a crimson tile (linen glyph) or a
 * linen surface (crimson glyph).
 */
const KNOWN: Record<string, React.ReactNode> = {
  // Gemini — four-point sparkle.
  gemini: (
    <path
      d="M50 6 C54 30 70 46 94 50 C70 54 54 70 50 94 C46 70 30 54 6 50 C30 46 46 30 50 6 Z"
      fill="currentColor"
    />
  ),
  // Claude — radiating sunburst.
  claude: (
    <path
      d="M50 10 V90 M10 50 H90 M21.7 21.7 L78.3 78.3 M78.3 21.7 L21.7 78.3"
      stroke="currentColor"
      strokeWidth="10"
      strokeLinecap="round"
    />
  ),
  // ChatGPT — hexagonal knot ring.
  chatgpt: (
    <path
      d="M50 8 L86 29 V71 L50 92 L14 71 V29 Z"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  // Perplexity — ringed stem.
  perplexity: (
    <>
      <circle cx="50" cy="50" r="33" stroke="currentColor" strokeWidth="9" fill="none" />
      <path d="M50 9 V91" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
    </>
  ),
  // Grok — angled slash.
  grok: <path d="M58 12 L84 12 L42 88 L16 88 Z" fill="currentColor" />,
};

// Distinct monograms — used at small sizes where the geometric glyphs blur into
// undifferentiated dots, and as the fallback for tools without a glyph.
const MONOGRAMS: Record<string, string> = {
  chatgpt: 'GPT',
  claude: 'Cl',
  gemini: 'Ge',
  perplexity: 'Px',
  grok: 'Gk',
  codex: 'Cx',
  deepseek: 'DS',
  manus: 'Mn',
  qwen: 'Qw',
  comet: 'Cm',
  cowork: 'Cw',
};

// Below this tile size the SVG glyphs don't resolve — use the monogram instead.
const GLYPH_MIN_SIZE = 34;

function toolKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function monogram(name: string): string {
  const key = toolKey(name);
  if (MONOGRAMS[key]) return MONOGRAMS[key];
  const cleaned = name.replace(/[^A-Za-z0-9]/g, '');
  return (cleaned.slice(0, 2) || '?').replace(/^./, (c) => c.toUpperCase());
}

export const ToolMark: React.FC<{ name: string; size?: number }> = ({ name, size = 36 }) => {
  const glyph = KNOWN[toolKey(name)];
  if (glyph && size >= GLYPH_MIN_SIZE) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        {glyph}
      </svg>
    );
  }
  const mono = monogram(name);
  return (
    <span
      style={{
        fontWeight: BRAND.font.weights.extraBold,
        fontSize: Math.round(size * (mono.length >= 3 ? 0.72 : 0.92)),
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
    >
      {mono}
    </span>
  );
};
