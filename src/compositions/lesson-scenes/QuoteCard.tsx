import React from 'react';
import { useCurrentFrame } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { QuoteCardContent } from './content-types';
import { BRAND, LEADING, space } from '../../brand/tokens';
import { SceneFrame, Eyebrow, useGlideIn, renderAccented } from './shared';

/**
 * `quote-card` — one Instructor-voice quote that anchors a lesson.
 *
 * Gate C 2026-06-08 defects fixed here (#72): the previous oversized decorative
 * mark was a lone unmatched `“` forced into a fixed-height box (fontSize 200 in
 * height 90), which spilled and collided with neighbors. Quote marks are now
 * matched, inline, accent-colored, and size intrinsically with the quote text —
 * nothing to overflow, nothing unclosed.
 */

export const QUOTE_MARKS = { open: '“', close: '”' } as const;

export const quoteStyles = {
  quote: {
    margin: 0,
    fontWeight: BRAND.font.weights.semiBold,
    fontSize: 56,
    lineHeight: LEADING.quote,
    letterSpacing: '-0.01em',
    maxWidth: 1180,
  } satisfies React.CSSProperties,
  attribution: {
    display: 'flex',
    alignItems: 'center',
    gap: space(4),
    marginTop: space(4),
    fontWeight: BRAND.font.weights.bold,
    fontSize: 26,
    color: BRAND.colors.textMuted,
  } satisfies React.CSSProperties,
} as const;

export const QuoteCard: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as QuoteCardContent;
  const frame = useCurrentFrame();
  const quote = useGlideIn(18, 24);
  const attr = useGlideIn(34, 16);
  // Idle float — the blockquote breathes on its own slow phase so the moment
  // never settle-and-freezes through the long hold (motion-contract idle float).
  const floatY = Math.sin((frame - 42) * 0.035) * 7;

  return (
    <SceneFrame align="flex-start" paddingX={180}>
      {/* Oversized ghost open-quote behind the text — an accentSoft anchor that
          occupies the void the inline marks can't fill. Zero collision: it sits
          behind the blockquote and is decor-only.
          top:140 (was 200) — the glyph's descender "leg" was crowding the
          Eyebrow row rendered just below it (defect: scenes 03+05). Shifted
          up for breathing room; purely decorative, doesn't move any text. */}
      <div
        aria-hidden
        data-decor
        style={{
          position: 'absolute',
          left: 120,
          top: 140,
          fontSize: 360,
          lineHeight: 1,
          fontWeight: BRAND.font.weights.bold,
          color: BRAND.colors.accentSoft,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {QUOTE_MARKS.open}
      </div>

      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>

      <blockquote
        style={{
          ...quote,
          ...quoteStyles.quote,
          position: 'relative',
          transform: `${quote.transform} translateY(${floatY}px)`,
        }}
      >
        <span style={{ color: BRAND.colors.accent }}>{QUOTE_MARKS.open}</span>
        {renderAccented(c.quote)}
        <span style={{ color: BRAND.colors.accent }}>{QUOTE_MARKS.close}</span>
      </blockquote>

      <div style={{ ...attr, ...quoteStyles.attribution }}>
        <span
          style={{ width: space(10), height: space(1), backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
        />
        {c.attribution}
      </div>
    </SceneFrame>
  );
};
