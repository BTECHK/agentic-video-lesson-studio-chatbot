import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { PreviewBandContent } from './content-types';
import { BRAND, SHADOW } from '../../brand/tokens';
import { SceneFrame, Eyebrow, useGlideIn, renderAccented } from './shared';

/**
 * `preview-band` (v2) — "coming next" beat.
 *
 * v2 deltas (from old tall accent rule + left-anchored layout):
 * - A single bgCard card floats in the center of SceneFrame
 * - 4px accent left border (borderLeft: `4px solid accent`)
 * - borderRadius: 0 radiusWindow radiusWindow 0 (left edge flush per reference)
 * - Accent eyebrow ("Coming next · …") — uppercase, small
 * - Big bold title using renderAccented for *word* markup
 * - Accent "→" arrow right-justified
 * - SHADOW.card depth; card glides in
 * - SceneFrame aligned center so the card is truly centered on screen
 */
export const PreviewBand: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as PreviewBandContent;
  const cardIn = useGlideIn(14, 28);
  const titleIn = useGlideIn(22, 22);

  return (
    <SceneFrame align="center" paddingX={200}>
      <div
        style={{
          ...cardIn,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          padding: '40px 48px',
          background: BRAND.colors.bgCard,
          borderLeft: `4px solid ${BRAND.colors.accent}`,
          borderRadius: `0 ${BRAND.radiusWindow}px ${BRAND.radiusWindow}px 0`,
          boxShadow: SHADOW.card,
        }}
      >
        {/* Left content: eyebrow + title */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow delay={14}>{c.eyebrow}</Eyebrow>

          {/* Big bold title */}
          <h2
            style={{
              ...titleIn,
              margin: 0,
              fontWeight: BRAND.font.weights.bold,
              fontSize: 64,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: BRAND.colors.text,
            }}
          >
            {renderAccented(c.title)}
          </h2>
        </div>

        {/* Right: accent arrow */}
        <div
          style={{
            fontSize: 48,
            color: BRAND.colors.accent,
            fontWeight: BRAND.font.weights.bold,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </SceneFrame>
  );
};
