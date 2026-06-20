import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { AuditQuadrantContent } from './content-types';
import { BRAND, SHADOW } from '../../brand/tokens';
import { SceneFrame, Eyebrow, SceneTitle, Glide } from './shared';

type QuadrantId = 'tl' | 'tr' | 'bl' | 'br';

/**
 * `audit-quadrant` (v2) — two-axis 2×2 grid.
 *
 * v2 deltas (from old flat CARD_BG + HAIRLINE border):
 * - Each quadrant zone is a floating tile: bgCard + 1px border + radiusWindow (14) + SHADOW.card
 * - Axis labels are accent uppercase eyebrow style (was textMuted MUTED)
 * - Quadrant titles bold; task items in textMuted
 * - All entrance stagger resolves within first ~7s; layout held from there.
 */
export const AuditQuadrant: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as AuditQuadrantContent;

  const byQuadrant: Record<QuadrantId, AuditQuadrantContent['tasks']> = {
    tl: [],
    tr: [],
    bl: [],
    br: [],
  };
  c.tasks.forEach((t) => byQuadrant[t.quadrant].push(t));

  // Axis label style — accent uppercase eyebrow
  const axisLabel: React.CSSProperties = {
    position: 'absolute',
    fontWeight: BRAND.font.weights.bold,
    fontSize: 15,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: BRAND.colors.accent,
    backgroundColor: BRAND.colors.bgBase,
    padding: '2px 12px',
  };

  // Zone positioning for each quadrant's floating tile
  const zoneStyle = (q: QuadrantId): React.CSSProperties => ({
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    // Tile appearance — the v2 floating card look
    background: BRAND.colors.bgCard,
    border: `1px solid ${BRAND.colors.border}`,
    borderRadius: BRAND.radiusWindow,
    boxShadow: SHADOW.card,
    padding: '20px 24px',
    ...(q === 'tl' && { left: '3%', top: 10, right: '53%' }),
    ...(q === 'tr' && { right: '3%', top: 10, left: '53%' }),
    ...(q === 'bl' && { left: '3%', bottom: 10, right: '53%', top: '52%' }),
    ...(q === 'br' && { right: '3%', bottom: 10, left: '53%', top: '52%' }),
  });

  let pillIndex = 0;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={54}>
        {c.title}
      </SceneTitle>

      <div style={{ position: 'relative', width: '100%', height: 480, marginTop: 4 }}>
        {/* Axes — borderStrong hairlines */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: BRAND.colors.borderStrong,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: BRAND.colors.borderStrong,
          }}
        />

        {/* Axis labels — accent eyebrow style */}
        <div style={{ ...axisLabel, left: '50%', top: -14, transform: 'translateX(-50%)' }}>
          {c.yAxis.top}
        </div>
        <div style={{ ...axisLabel, left: '50%', bottom: -14, transform: 'translateX(-50%)' }}>
          {c.yAxis.bottom}
        </div>
        <div style={{ ...axisLabel, left: 0, top: '50%', transform: 'translateY(-50%)' }}>
          {c.xAxis.left}
        </div>
        <div style={{ ...axisLabel, right: 0, top: '50%', transform: 'translateY(-50%)' }}>
          {c.xAxis.right}
        </div>

        {/* Quadrant floating tiles */}
        {(Object.keys(byQuadrant) as QuadrantId[]).map((q) => (
          <div key={q} style={zoneStyle(q)}>
            {byQuadrant[q].map((t) => {
              const delay = 42 + pillIndex++ * 9;
              return (
                <Glide key={t.id} delay={delay} fromY={16}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Task label */}
                    <span
                      style={{
                        fontWeight: BRAND.font.weights.semiBold,
                        fontSize: 22,
                        color: BRAND.colors.textMuted,
                        flex: 1,
                      }}
                    >
                      {t.label}
                    </span>
                    {/* Capability tag — accent accentSoft pill */}
                    <span
                      style={{
                        fontWeight: BRAND.font.weights.bold,
                        fontSize: 12,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        color: BRAND.colors.accent,
                        backgroundColor: BRAND.colors.accentSoft,
                        borderRadius: BRAND.radius,
                        padding: '4px 10px',
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {t.cap}
                    </span>
                  </div>
                </Glide>
              );
            })}
          </div>
        ))}
      </div>
    </SceneFrame>
  );
};
