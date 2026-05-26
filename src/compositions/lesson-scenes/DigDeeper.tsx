import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, useGlideIn } from './shared';

const CARD_BG = '#F7F4EF';

/**
 * `dig-deeper` — optional background reading. Per the scene catalog this is
 * normally an inline "leave-behind" element rather than a full scene, and its
 * content schema is empty. This standalone fallback renders a branded
 * "optional context" card so the dispatcher has a component for every type.
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
      <div
        style={{
          ...card,
          width: '100%',
          marginTop: 8,
          padding: '32px 36px',
          backgroundColor: CARD_BG,
          border: `2px dashed ${HAIRLINE}`,
          borderRadius: BRAND.radius,
          boxSizing: 'border-box',
          fontSize: 28,
          lineHeight: 1.5,
          color: MUTED,
        }}
      >
        {body}
      </div>
    </SceneFrame>
  );
};
