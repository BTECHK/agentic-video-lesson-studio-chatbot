import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { RecapGridContent } from './content-types';
import { BRAND, LEADING } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, Glide, useGlideIn } from './shared';

/**
 * `recap-grid` — end-of-lesson summary: three numbered cards glide in (card-
 * white + 1px border + 4px radius, flat on linen, big crimson numeral), then an optional "Coming
 * next" preview band slides up (bgCard + 4px accent left rule + accent eyebrow
 * + bold title + accent arrow).
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
                backgroundColor: BRAND.colors.bgCard,
                border: `1px solid ${BRAND.colors.border}`,
                borderRadius: BRAND.radius,
                padding: '44px 38px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 16,
                height: '100%',
                boxSizing: 'border-box',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontWeight: BRAND.font.weights.bold,
                  fontSize: 64,
                  color: BRAND.colors.accent,
                  lineHeight: 1,
                  letterSpacing: '-0.015em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {card.n}
              </div>
              <div
                style={{
                  fontWeight: BRAND.font.weights.bold,
                  fontSize: 32,
                  lineHeight: LEADING.heading,
                  marginTop: 6,
                  // Reserve a 2-line floor so 1- and 2-line titles share one
                  // baseline and the bodies line up across the row.
                  minHeight: 70,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontWeight: BRAND.font.weights.regular,
                  fontSize: 22,
                  lineHeight: LEADING.body,
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
            gap: 24,
            width: '100%',
            marginTop: 12,
            padding: '28px 36px',
            backgroundColor: BRAND.colors.bgCard,
            borderLeft: `4px solid ${BRAND.colors.accent}`,
            borderRadius: `0 ${BRAND.radius}px ${BRAND.radius}px 0`,
            boxShadow: 'none',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontWeight: BRAND.font.weights.bold,
                fontSize: 14,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BRAND.colors.accent,
              }}
            >
              {c.preview.eyebrow}
            </div>
            <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 32, lineHeight: 1.05, color: BRAND.colors.text, letterSpacing: '-0.015em' }}>
              {c.preview.title}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 32, color: BRAND.colors.accent, fontWeight: BRAND.font.weights.bold }}>
            →
          </div>
        </div>
      )}
    </SceneFrame>
  );
};
