import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { AssignmentListContent } from './content-types';
import { BRAND, MUTED, SceneFrame, Eyebrow, SceneTitle, SceneSub, Glide, useGlideIn } from './shared';

/**
 * `assignment-list` — pre-class homework. A checkbox + bold task + context per
 * row (staggered in), with an optional accent callout below.
 */
export const AssignmentList: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as AssignmentListContent;
  const calloutDelay = 48 + c.tasks.length * 10 + 8;
  const callout = useGlideIn(calloutDelay, 22);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', marginTop: 16 }}>
        {c.tasks.map((task, i) => (
          <Glide key={task.id} delay={48 + i * 10} fromY={20}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: BRAND.radius,
                  border: `3px solid ${BRAND.colors.accent}`,
                  flexShrink: 0,
                  alignSelf: 'center',
                }}
              />
              <div style={{ fontSize: 32, lineHeight: 1.35 }}>
                <span style={{ fontWeight: BRAND.font.weights.bold, color: BRAND.colors.text }}>
                  {task.bold}
                </span>{' '}
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
            marginTop: 16,
            padding: '24px 32px',
            borderRadius: BRAND.radius,
            backgroundColor: 'rgba(139,38,53,0.08)',
            borderLeft: `6px solid ${BRAND.colors.accent}`,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontWeight: BRAND.font.weights.bold,
              fontSize: 16,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BRAND.colors.accent,
            }}
          >
            {c.callout.label}
          </div>
          <div style={{ fontWeight: BRAND.font.weights.semiBold, fontSize: 28, lineHeight: 1.3 }}>
            {c.callout.body}
          </div>
        </div>
      )}
    </SceneFrame>
  );
};
