import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { QuoteCardContent } from './content-types';
import { BRAND, MUTED, SceneFrame, Eyebrow, useGlideIn, renderAccented } from './shared';

/**
 * `quote-card` — one Instructor-voice quote that anchors a lesson. Oversized accent
 * quote mark, the quote (with `*emphasis*`), then attribution.
 */
export const QuoteCard: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as QuoteCardContent;
  const mark = useGlideIn(8, 16);
  const quote = useGlideIn(18, 24);
  const attr = useGlideIn(34, 16);

  return (
    <SceneFrame align="flex-start" paddingX={180}>
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>

      <div
        style={{
          ...mark,
          fontFamily: 'Georgia, serif',
          fontSize: 200,
          lineHeight: 0.5,
          height: 90,
          color: BRAND.colors.accent,
        }}
      >
        &ldquo;
      </div>

      <blockquote
        style={{
          ...quote,
          margin: 0,
          fontWeight: BRAND.font.weights.semiBold,
          fontSize: 56,
          lineHeight: 1.28,
          letterSpacing: '-0.01em',
          maxWidth: 1500,
        }}
      >
        {renderAccented(c.quote)}
      </blockquote>

      <div
        style={{
          ...attr,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 12,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 26,
          color: MUTED,
        }}
      >
        <span
          style={{ width: 40, height: 4, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
        />
        {c.attribution}
      </div>
    </SceneFrame>
  );
};
