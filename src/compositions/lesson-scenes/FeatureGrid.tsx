import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { FeatureGridContent } from './content-types';
import { BRAND, SHADOW, LEADING } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, Glide, renderAccented } from './shared';

/**
 * `feature-grid` — named feature categories with one-line descriptions, laid
 * out in a two-column grid. Each card glides in with a stagger; then each
 * card "focuses" in turn (accent border + lift + cardHover shadow, others dim
 * to ~0.6 opacity), before all settle flat.
 */
export const FeatureGrid: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as FeatureGridContent;
  const frame = useCurrentFrame();
  const hasFocusPass = c.features.some((f) => f.focusAt > 0);
  // Focus ramps up, holds ~1.3s (39 frames), then ramps back to 0.
  const focusFor = (focusAt: number): number =>
    hasFocusPass
      ? interpolate(frame, [focusAt - 8, focusAt, focusAt + 39, focusAt + 51], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const activeFocus = hasFocusPass ? Math.max(...c.features.map((f) => focusFor(f.focusAt))) : 0;

  // Count-aware columns: 3 -> single 3-up row, 4 -> 2x2, 1/2 -> one row.
  const n = c.features.length;
  const small = n <= 2;
  const gridTemplateColumns = n === 3 ? 'repeat(3,1fr)' : n >= 4 ? '1fr 1fr' : `repeat(${n},1fr)`;

  return (
    <SceneFrame align={small ? 'center' : 'flex-start'}>
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={68}>
        {renderAccented(c.title)}
      </SceneTitle>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          gap: 28,
          width: '100%',
          marginTop: small ? 0 : 24,
        }}
      >
        {c.features.map((f, i) => (
          <Glide key={f.id} delay={36 + i * 9} fromY={30}>
            {(() => {
              const focus = focusFor(f.focusAt);
              const isActive = focus > 0.05;
              const dimmed = activeFocus > 0.1 && !isActive;
              return (
                <div
                  style={{
                    backgroundColor: BRAND.colors.bgCard,
                    border: `1px solid ${isActive ? BRAND.colors.accent : BRAND.colors.border}`,
                    borderRadius: BRAND.radius,
                    padding: '28px 32px',
                    display: 'flex',
                    gap: 24,
                    alignItems: 'flex-start',
                    height: '100%',
                    boxSizing: 'border-box',
                    opacity: dimmed ? interpolate(focus, [0, 1], [0.4, 1]) : 1,
                    filter: dimmed ? 'grayscale(0.6)' : 'none',
                    transform: `translateY(${interpolate(focus, [0, 1], [0, -6])}px)`,
                    boxShadow: isActive ? SHADOW.cardHover : 'none',
                  }}
                >
                  {f.n ? (
                    <div
                      style={{
                        fontWeight: BRAND.font.weights.bold,
                        fontSize: 64,
                        color: BRAND.colors.accent,
                        lineHeight: 1,
                        minWidth: 80,
                        fontVariantNumeric: 'tabular-nums',
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
                          color: BRAND.colors.accent,
                        }}
                      >
                        {f.cat}
                      </div>
                    ) : null}
                    <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 34, lineHeight: LEADING.heading }}>
                      {f.title}
                    </div>
                    {f.sub ? (
                      <div
                        style={{
                          fontWeight: BRAND.font.weights.medium,
                          fontSize: 17,
                          lineHeight: 1.55,
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
