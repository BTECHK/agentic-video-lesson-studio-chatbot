import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { FeatureGridContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, Glide } from './shared';

const CARD_BG = '#F7F4EF';

/**
 * `feature-grid` — named feature categories with one-line descriptions, laid
 * out in a two-column grid. Each card glides in with a stagger.
 */
export const FeatureGrid: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as FeatureGridContent;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={68}>
        {c.title}
      </SceneTitle>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 28,
          width: '100%',
          marginTop: 24,
        }}
      >
        {c.features.map((f, i) => (
          <Glide key={f.id} delay={36 + i * 9} fromY={30}>
            <div
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${HAIRLINE}`,
                borderRadius: BRAND.radius,
                padding: '28px 32px',
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  fontWeight: BRAND.font.weights.extraBold,
                  fontSize: 48,
                  color: BRAND.colors.accent,
                  lineHeight: 1,
                  minWidth: 70,
                }}
              >
                {f.n}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    fontWeight: BRAND.font.weights.bold,
                    fontSize: 15,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: MUTED,
                  }}
                >
                  {f.cat}
                </div>
                <div style={{ fontWeight: BRAND.font.weights.extraBold, fontSize: 34, lineHeight: 1.1 }}>
                  {f.title}
                </div>
                <div
                  style={{
                    fontWeight: BRAND.font.weights.regular,
                    fontSize: 22,
                    lineHeight: 1.4,
                    color: MUTED,
                  }}
                >
                  {f.sub}
                </div>
              </div>
            </div>
          </Glide>
        ))}
      </div>
    </SceneFrame>
  );
};
