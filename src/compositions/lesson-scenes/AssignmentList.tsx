import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { AssignmentListContent } from './content-types';
import { BRAND, LEADING } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, SceneSub, Glide, useGlideIn, eyebrowStyle } from './shared';

/**
 * Density tier by task count: 0 (<4, the current shipped spacing), 1 (4
 * tasks), 2 (5+ tasks — the worst real case, a long assignment lesson,
 * needs the deepest compression to clear CONTENT_SAFE_BOTTOM). A plain 2-tier
 * `listGap` isn't enough headroom at 5 tasks + callout — hand-derived against
 * the real measured render (see AssignmentList docblock below).
 */
export function densityTier(taskCount: number): 0 | 1 | 2 {
  if (taskCount >= 5) return 2;
  if (taskCount === 4) return 1;
  return 0;
}

/**
 * `assignment-list` — pre-class homework. Each task row: accent square
 * checkbox (4px radius, accent border, accentSoft fill) + bold task + context
 * in textMuted. Optional callout: bgCard + 1px border + 4px radius (flat) + accent eyebrow.
 *
 * Top-anchored (`justify="flex-start"`), NOT vertically centered like every
 * other scene: this is the one scene type whose content height swings widely
 * (2-6 tasks + an optional multi-line callout), and centering a tall block
 * only spends HALF of any height cut on moving the top down — the other half
 * is wasted, making the CONTENT_SAFE_BOTTOM floor unreachable for a long list
 * (defect: a 5-task lesson, 5 tasks + callout — eyebrow rendered ON the "Sample
 * Academy" watermark, callout bottom deep inside the pagination/caption band).
 * Top-anchoring makes the top position fixed (120px, clear of the watermark's
 * ~95px-tall footprint) regardless of task count, so 100% of any height cut
 * goes toward the bottom floor instead of 50%.
 *
 * All of eyebrow/title/sub/tasks/callout are ONE flex column (not five direct
 * SceneFrame children) so SceneFrame's own 40px inter-child gap is paid ONCE
 * between sections here, not four times — reclaimed height that funds the
 * tiered tightening below without shrinking any font.
 *
 * `densityTier` scales row gap, section gaps, row leading (LEADING.heading,
 * not a hardcoded value) and callout padding/gap — hand-derived against the
 * real measured render (a long assignment lesson) so the worst
 * real case (5 tasks + callout) clears both the top (watermark) and bottom
 * (CONTENT_SAFE_BOTTOM) floors with margin, not just on paper.
 */
export const AssignmentList: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as AssignmentListContent;
  const tasks = c.tasks.length;
  const tier = densityTier(tasks);
  const sectionGap = [40, 24, 20][tier];
  const rowGap = [12, 6, 4][tier];
  const rowLineHeight = tier > 0 ? LEADING.heading : 1.35;
  const calloutPadY = [24, 16, 14][tier];
  const calloutGap = [8, 4, 4][tier];
  const calloutDelay = 48 + tasks * 10 + 8;
  const callout = useGlideIn(calloutDelay, 22);

  return (
    <SceneFrame align="flex-start" justify="flex-start">
      <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
          <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
          <SceneTitle delay={14} size={72}>
            {c.title}
          </SceneTitle>
          <SceneSub delay={26}>{c.sub}</SceneSub>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap, width: '100%' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 32, lineHeight: rowLineHeight }}>
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
              gap: calloutGap,
              width: '100%',
              padding: `${calloutPadY}px 32px`,
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
      </div>
    </SceneFrame>
  );
};
