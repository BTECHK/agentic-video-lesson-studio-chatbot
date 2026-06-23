import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import { BRAND } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, useGlideIn } from './shared';

/**
 * `dig-deeper` (v2) — optional background-context panel. A `bgCard` +
 * `border` + 4px `radius` card with an accent eyebrow/label and body in
 * `textMuted` / `MUTED`. Card sits flat on linen (no resting shadow). Mostly
 * static — just the card entrance glide, then holds.
 */
export const DigDeeper: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as Record<string, unknown>;
  const eyebrow = typeof c.eyebrow === 'string' ? c.eyebrow : 'Optional';
  const title = typeof c.title === 'string' ? c.title : 'Dig deeper';
  const body =
    typeof c.body === 'string'
      ? c.body
      : 'Background context for the curious — not required to move on.';
  const card = useGlideIn(20, 24);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={66}>
        {title}
      </SceneTitle>

      {/* Accent eyebrow label inside the card */}
      <div style={{ ...card, width: '100%', marginTop: 8 }}>
        <div
          style={{
            padding: '32px 36px',
            backgroundColor: BRAND.colors.bgCard,
            border: `1px solid ${BRAND.colors.border}`,
            borderRadius: BRAND.radius,
            boxShadow: 'none',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: BRAND.font.weights.bold,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: BRAND.colors.accent,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 28,
                height: 3,
                borderRadius: BRAND.radius,
                backgroundColor: BRAND.colors.accent,
              }}
            />
            Context
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.55,
              color: MUTED,
              fontWeight: BRAND.font.weights.regular,
            }}
          >
            {body}
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};
