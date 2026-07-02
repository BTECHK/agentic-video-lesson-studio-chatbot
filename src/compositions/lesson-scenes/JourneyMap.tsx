import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { JourneyMapContent } from './content-types';
import { BRAND, LEADING } from '../../brand/tokens';
import { GLIDE, SceneFrame, Eyebrow, SceneTitle, SceneSub, Pop } from './shared';

/**
 * `journey-map` (v2) — "you are here" on a multi-step track.
 *
 * v2 deltas:
 * - background track hairline uses `borderStrong` (was HAIRLINE raw)
 * - stop dots: done = accent filled, active = accent filled + `accentSoft` 8px
 *   glow ring (bigger dot), todo = bgCard + border
 * - accent fill animates along the track to the active stop
 * - "You are here" pill — accent bg, bgBase text — pops below the active stop
 * - Labels in textMuted, active label in accent
 * All motion settles within first ~7s then holds.
 */
export const JourneyMap: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as JourneyMapContent;
  const frame = useCurrentFrame();

  const n = c.stops.length;
  const isDestination = c.variant === 'destination';
  const activeIndex = isDestination ? n - 1 : Math.max(0, c.stops.findIndex((s) => s.state === 'active'));
  const x0 = 1 / (2 * n); // center of first stop (fraction of width)
  const xa = isDestination ? 1 - x0 : (activeIndex + 0.5) / n;

  // Track draws at 1.5s; accent fill follows at 2.0s — both settle well within 7s.
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

  const trackTop = 70; // px from top of map block to dot centerline

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ position: 'relative', width: '100%', height: 320, marginTop: 40 }}>
        {/* Base track — borderStrong hairline */}
        <div
          style={{
            position: 'absolute',
            top: trackTop,
            left: `${x0 * 100}%`,
            width: `${(1 - 2 * x0) * 100 * trackProgress}%`,
            height: 2,
            backgroundColor: BRAND.colors.borderStrong,
            borderRadius: BRAND.radius,
          }}
        />
        {/* Accent fill animates to active stop */}
        <div
          style={{
            position: 'absolute',
            top: trackTop,
            left: `${x0 * 100}%`,
            width: `${(xa - x0) * 100 * fillProgress}%`,
            height: 2,
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
              {/* Label stack — clear breathing room under the node row, capped to
                  the column width (~200px < the 7-up column share) and centered so
                  multi-line titles wrap WITHIN their column and never crowd a
                  neighbour. */}
              <Pop delay={50 + i * 4} style={{ marginTop: 44, textAlign: 'center', maxWidth: 200 }}>
                {/* Eyebrow slot — fixed 2-line height so 1- and 2-line labels
                    bottom-align and every stop.title shares one baseline. Type
                    matches the canonical eyebrow token (600 / 14px / 0.14em). */}
                <div
                  style={{
                    minHeight: Math.round(14 * LEADING.caps * 2),
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontWeight: BRAND.font.weights.semiBold,
                      fontSize: 14,
                      lineHeight: LEADING.caps,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase' as const,
                      color: stop.state === 'active' ? BRAND.colors.accent : BRAND.colors.textMuted,
                    }}
                  >
                    {stop.label}
                  </div>
                </div>
                {/* Stop-title slot — fixed 2-line height so a wrapping title
                    never pushes the reserved pill row down; titles top-align so
                    every node's pill row sits at one constant Y. */}
                <div
                  style={{
                    marginTop: 8,
                    minHeight: Math.round(23 * 1.25 * 2),
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontWeight: BRAND.font.weights.semiBold,
                      fontSize: 23,
                      lineHeight: 1.25,
                      color: stop.state === 'todo' ? BRAND.colors.textMuted : BRAND.colors.text,
                    }}
                  >
                    {stop.title}
                  </div>
                </div>
              </Pop>

              {/* Reserved pill row — always present so every node column is the
                  same height; the crimson "You are here" pill fills it only on
                  the active non-destination stop. */}
              <div
                style={{
                  marginTop: 26,
                  height: 25,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {stop.state === 'active' && !isDestination && (
                  <Pop delay={90}>
                    <div
                      style={{
                        backgroundColor: BRAND.colors.accent,
                        color: BRAND.colors.bgCard,
                        fontWeight: BRAND.font.weights.bold,
                        fontSize: 11,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase' as const,
                        padding: '5px 10px',
                        borderRadius: BRAND.radius,
                      }}
                    >
                      You are here
                    </div>
                  </Pop>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

/**
 * Stop dot — v2 variants:
 * - done:   accent filled, no ring
 * - active: accent filled, accentSoft 8px glow ring (same size as the rest)
 * - todo:   bgBase fill, borderStrong border
 */
const Dot: React.FC<{ state: 'done' | 'active' | 'todo' }> = ({ state }) => {
  const size = 30;

  const bg = state === 'todo' ? BRAND.colors.bgBase : BRAND.colors.accent;
  const border = state === 'todo' ? BRAND.colors.borderStrong : BRAND.colors.accent;
  const ring = state === 'active' ? `0 0 0 8px ${BRAND.colors.accentSoft}` : 'none';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        border: `2px solid ${border}`,
        boxShadow: ring,
      }}
    />
  );
};
