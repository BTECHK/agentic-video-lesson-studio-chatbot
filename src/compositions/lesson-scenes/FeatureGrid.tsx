import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { FeatureGridContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, Glide, renderAccented } from './shared';

const CARD_BG = '#F7F4EF';

/**
 * `feature-grid` — named feature categories with one-line descriptions, laid
 * out in a two-column grid. Each card glides in with a stagger.
 */
export const FeatureGrid: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as FeatureGridContent;
  const frame = useCurrentFrame();
  const hasFocusPass = c.features.some((f) => f.focusAt > 0);
  const focusFor = (focusAt: number): number =>
    hasFocusPass
      ? interpolate(frame, [focusAt - 8, focusAt, focusAt + 22], [0, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const activeFocus = hasFocusPass ? Math.max(...c.features.map((f) => focusFor(f.focusAt))) : 0;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={68}>
        {renderAccented(c.title)}
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
            {(() => {
              const focus = focusFor(f.focusAt);
              const dimmed = activeFocus > 0.1 && focus < 0.1;
              return (
                <div
                  style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${focus > 0.2 ? BRAND.colors.accent : HAIRLINE}`,
                    borderRadius: BRAND.radius,
                    padding: '28px 32px',
                    display: 'flex',
                    gap: 24,
                    alignItems: 'flex-start',
                    height: '100%',
                    boxSizing: 'border-box',
                    opacity: dimmed ? 0.48 : 1,
                    transform: `translateY(${-10 * focus}px) scale(${1 + 0.025 * focus})`,
                    boxShadow: focus > 0.2 ? '0 18px 48px rgba(139,38,53,0.16)' : 'none',
                  }}
                >
                  {f.n ? (
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
                  ) : null}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {f.cat ? (
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
                    ) : null}
                    <div style={{ fontWeight: BRAND.font.weights.extraBold, fontSize: 34, lineHeight: 1.1 }}>
                      {f.title}
                    </div>
                    {f.sub ? (
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
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </Glide>
        ))}
      </div>
    </SceneFrame>
  );
};
