import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { AuditQuadrantContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, Glide } from './shared';

const CARD_BG = '#F7F4EF';

type QuadrantId = 'tl' | 'tr' | 'bl' | 'br';

/**
 * `audit-quadrant` — the two-axis grid:
 * Y = axis A (high → low), X = axis B (low → high). Real tasks are
 * plotted into their quadrant as pills, each tagged with the AI capability it
 * maps to. Built because feature-grid cards cannot show the grid itself —
 * the outline specifies "real tasks mapped to the grid".
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

  const axisLabel: React.CSSProperties = {
    position: 'absolute',
    fontWeight: BRAND.font.weights.bold,
    fontSize: 15,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: MUTED,
    backgroundColor: BRAND.colors.bgBase,
    padding: '2px 12px',
  };

  const zone = (q: QuadrantId): React.CSSProperties => ({
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    ...(q === 'tl' && { left: '5%', top: 44, alignItems: 'flex-start' }),
    ...(q === 'tr' && { right: '5%', top: 44, alignItems: 'flex-end' }),
    ...(q === 'bl' && { left: '5%', bottom: 44, alignItems: 'flex-start' }),
    ...(q === 'br' && { right: '5%', bottom: 44, alignItems: 'flex-end' }),
  });

  let pillIndex = 0;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={54}>
        {c.title}
      </SceneTitle>

      <div style={{ position: 'relative', width: '100%', height: 440, marginTop: 4 }}>
        {/* axes */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: HAIRLINE,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: HAIRLINE,
          }}
        />

        {/* axis labels */}
        <div style={{ ...axisLabel, left: '50%', top: -12, transform: 'translateX(-50%)' }}>
          {c.yAxis.top}
        </div>
        <div style={{ ...axisLabel, left: '50%', bottom: -12, transform: 'translateX(-50%)' }}>
          {c.yAxis.bottom}
        </div>
        <div style={{ ...axisLabel, left: 0, top: '50%', transform: 'translateY(-50%)' }}>
          {c.xAxis.left}
        </div>
        <div style={{ ...axisLabel, right: 0, top: '50%', transform: 'translateY(-50%)' }}>
          {c.xAxis.right}
        </div>

        {/* plotted tasks */}
        {(Object.keys(byQuadrant) as QuadrantId[]).map((q) => (
          <div key={q} style={zone(q)}>
            {byQuadrant[q].map((t) => {
              const delay = 42 + pillIndex++ * 9;
              return (
                <Glide key={t.id} delay={delay} fromY={22}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      backgroundColor: CARD_BG,
                      border: `1px solid ${HAIRLINE}`,
                      borderRadius: BRAND.radius,
                      padding: '14px 22px',
                    }}
                  >
                    <span style={{ fontWeight: BRAND.font.weights.semiBold, fontSize: 25 }}>
                      {t.label}
                    </span>
                    <span
                      style={{
                        fontWeight: BRAND.font.weights.bold,
                        fontSize: 13,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: BRAND.colors.accent,
                        backgroundColor: 'rgba(139,38,53,0.08)',
                        borderRadius: BRAND.radius,
                        padding: '4px 10px',
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
