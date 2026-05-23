import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { RecapGridContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, Glide, useGlideIn } from './shared';

const CARD_BG = '#F7F4EF';

/**
 * `recap-grid` — end-of-lesson summary: three numbered cards glide in, then an
 * optional "coming next" preview band slides up beneath them.
 */
export const RecapGrid: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as RecapGridContent;
  const preview = useGlideIn(135, 28);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>

      <div style={{ display: 'flex', gap: 28, width: '100%', marginTop: 24 }}>
        {c.cards.map((card, i) => (
          <Glide key={card.id} delay={36 + i * 10} fromY={30} style={{ flex: 1 }}>
            <div
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${HAIRLINE}`,
                borderRadius: BRAND.radius,
                padding: 36,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  fontWeight: BRAND.font.weights.extraBold,
                  fontSize: 40,
                  color: BRAND.colors.accent,
                  lineHeight: 1,
                }}
              >
                {card.n}
              </div>
              <div style={{ fontWeight: BRAND.font.weights.extraBold, fontSize: 32, lineHeight: 1.1 }}>
                {card.title}
              </div>
              <div
                style={{
                  fontWeight: BRAND.font.weights.regular,
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: MUTED,
                }}
              >
                {card.body}
              </div>
            </div>
          </Glide>
        ))}
      </div>

      {c.preview && (
        <div
          style={{
            ...preview,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            width: '100%',
            marginTop: 12,
            padding: '28px 36px',
            borderRadius: BRAND.radius,
            backgroundColor: BRAND.colors.accent,
            color: BRAND.colors.bgBase,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontWeight: BRAND.font.weights.bold,
              fontSize: 18,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            {c.preview.eyebrow}
          </div>
          <div style={{ width: 2, height: 40, backgroundColor: 'rgba(237,232,227,0.4)' }} />
          <div style={{ fontWeight: BRAND.font.weights.extraBold, fontSize: 38, lineHeight: 1.05 }}>
            {c.preview.title}
          </div>
        </div>
      )}
    </SceneFrame>
  );
};
