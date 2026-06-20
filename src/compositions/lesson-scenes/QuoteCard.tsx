import React from 'react';
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
    maxWidth: 1500,
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
  const quote = useGlideIn(18, 24);
  const attr = useGlideIn(34, 16);

  return (
    <SceneFrame align="flex-start" paddingX={180}>
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>

      <blockquote style={{ ...quote, ...quoteStyles.quote }}>
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
