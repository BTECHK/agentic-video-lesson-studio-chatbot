import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { JourneyMapContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, GLIDE, SceneFrame, Eyebrow, SceneTitle, SceneSub, Pop } from './shared';

/**
 * `journey-map` — "you are here" within a multi-step path. A track line draws
 * across, stops pop in (staggered), the accent fill animates to the active
 * stop, and a "You are here" pill drops below it. Beats per scene-catalog.
 */
export const JourneyMap: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as JourneyMapContent;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n = c.stops.length;
  const activeIndex = Math.max(0, c.stops.findIndex((s) => s.state === 'active'));
  const x0 = 1 / (2 * n); // center of first stop (fraction of width)
  const xa = (activeIndex + 0.5) / n; // center of active stop

  // Track draws 1.5s in; accent fill follows at 2.0s.
  const trackProgress = interpolate(frame, [45, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...GLIDE),
  });
  const fillProgress = interpolate(frame, [60, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...GLIDE),
  });

  const trackTop = 70; // px from top of the map block to the dot centerline

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ position: 'relative', width: '100%', height: 320, marginTop: 40 }}>
        {/* base track */}
        <div
          style={{
            position: 'absolute',
            top: trackTop,
            left: `${x0 * 100}%`,
            width: `${(1 - 2 * x0) * 100 * trackProgress}%`,
            height: 4,
            backgroundColor: HAIRLINE,
            borderRadius: BRAND.radius,
          }}
        />
        {/* accent fill to active */}
        <div
          style={{
            position: 'absolute',
            top: trackTop,
            left: `${x0 * 100}%`,
            width: `${(xa - x0) * 100 * fillProgress}%`,
            height: 4,
            backgroundColor: BRAND.colors.accent,
            borderRadius: BRAND.radius,
          }}
        />

        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {c.stops.map((stop, i) => (
            <div
              key={stop.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Pop delay={48 + i * 4}>
                <Dot state={stop.state} />
              </Pop>
              <Pop delay={50 + i * 4} style={{ marginTop: 24, textAlign: 'center', maxWidth: 280 }}>
                <div
                  style={{
                    fontWeight: BRAND.font.weights.bold,
                    fontSize: 18,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: stop.state === 'todo' ? MUTED : BRAND.colors.accent,
                  }}
                >
                  {stop.label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontWeight: BRAND.font.weights.semiBold,
                    fontSize: 26,
                    lineHeight: 1.2,
                    color: stop.state === 'todo' ? MUTED : BRAND.colors.text,
                  }}
                >
                  {stop.title}
                </div>
              </Pop>
              {stop.state === 'active' && (
                <Pop delay={90} style={{ marginTop: 18 }}>
                  <div
                    style={{
                      backgroundColor: BRAND.colors.accent,
                      color: BRAND.colors.bgBase,
                      fontWeight: BRAND.font.weights.bold,
                      fontSize: 18,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '8px 16px',
                      borderRadius: BRAND.radius,
                    }}
                  >
                    You are here
                  </div>
                </Pop>
              )}
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

const Dot: React.FC<{ state: 'done' | 'active' | 'todo' }> = ({ state }) => {
  const size = state === 'active' ? 40 : 28;
  const bg =
    state === 'todo' ? BRAND.colors.bgBase : BRAND.colors.accent;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        border: `4px solid ${state === 'todo' ? HAIRLINE : BRAND.colors.accent}`,
        boxShadow: state === 'active' ? `0 0 0 8px rgba(139,38,53,0.14)` : 'none',
      }}
    />
  );
};
