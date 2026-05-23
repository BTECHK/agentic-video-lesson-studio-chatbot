import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { PreviewBandContent } from './content-types';
import { BRAND, SceneFrame, Eyebrow, useGlideIn, renderAccented } from './shared';

/**
 * `preview-band` — a "coming next" beat. Accent kicker over a large title,
 * left-anchored with a tall accent rule.
 */
export const PreviewBand: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as PreviewBandContent;
  const title = useGlideIn(18, 26);

  return (
    <SceneFrame align="flex-start">
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div
          style={{
            width: 8,
            height: 220,
            backgroundColor: BRAND.colors.accent,
            borderRadius: BRAND.radius,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
          <h1
            style={{
              ...title,
              margin: 0,
              fontWeight: BRAND.font.weights.extraBold,
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: 1400,
            }}
          >
            {renderAccented(c.title)}
          </h1>
        </div>
      </div>
    </SceneFrame>
  );
};
