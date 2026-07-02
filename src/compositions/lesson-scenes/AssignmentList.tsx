import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { AssignmentListContent } from './content-types';
import { BRAND } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, SceneSub, Glide, useGlideIn, eyebrowStyle, listGap } from './shared';

/**
 * `assignment-list` — pre-class homework. Each task row: accent square
 * checkbox (4px radius, accent border, accentSoft fill) + bold task + context
 * in textMuted. Optional callout: bgCard + 1px border + 4px radius (flat) + accent eyebrow.
 *
 * 4+ tasks tighten the row/callout gap (`listGap`) — a long list otherwise
 * pushes the vertically-centered content block's top above the chrome
 * watermark and its bottom under the pagination band (defects: eyebrow over
 * "Sample Academy"; long callout flush against/under the dots).
 */
export const AssignmentList: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as AssignmentListContent;
  const gap = listGap(c.tasks.length, 12, 6);
  const calloutMarginTop = listGap(c.tasks.length, 8, 4);
  const calloutDelay = 48 + c.tasks.length * 10 + 8;
  const callout = useGlideIn(calloutDelay, 22);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ display: 'flex', flexDirection: 'column', gap, width: '100%', marginTop: 8 }}>
        {c.tasks.map((task, i) => (
          <Glide key={task.id} delay={48 + i * 10} fromY={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Accent square checkbox: 4px radius, accent border, accentSoft fill */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: BRAND.radius,
                  border: `2px solid ${BRAND.colors.accent}`,
                  backgroundColor: BRAND.colors.accentSoft,
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 32, lineHeight: 1.35 }}>
                <span style={{ fontWeight: BRAND.font.weights.bold, color: BRAND.colors.text }}>
                  {task.bold}
                </span>
                <span style={{ fontWeight: BRAND.font.weights.regular, color: MUTED }}>
                  {task.context}
                </span>
              </div>
            </div>
          </Glide>
        ))}
      </div>

      {c.callout && (
        <div
          style={{
            ...callout,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            marginTop: calloutMarginTop,
            padding: '24px 32px',
            borderRadius: BRAND.radius,
            backgroundColor: BRAND.colors.bgCard,
            boxShadow: 'none',
            border: `1px solid ${BRAND.colors.border}`,
            boxSizing: 'border-box',
          }}
        >
          <div style={eyebrowStyle()}>{c.callout.label}</div>
          <div style={{ fontWeight: BRAND.font.weights.semiBold, fontSize: 28, lineHeight: 1.3 }}>
            {c.callout.body}
          </div>
        </div>
      )}
    </SceneFrame>
  );
};
