import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { SetupChecklistContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, SceneTitle, SceneSub } from './shared';

const CARD_BG = '#F7F4EF';
const DONE_AFTER = 1.6; // seconds after activateAt a row flips to "Done"

/**
 * `setup-checklist` — sequential settings that each "light up" (accent border +
 * spinner) at `activateAt`, then flip to "Done" (check + pill) 1.6s later.
 */
export const SetupChecklist: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as SetupChecklistContent;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={66}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginTop: 16 }}>
        {c.items.map((item) => (
          <ChecklistRow key={item.id} name={item.name} why={item.why} activateAt={item.activateAt} />
        ))}
      </div>
    </SceneFrame>
  );
};

const ChecklistRow: React.FC<{ name: string; why: string; activateAt: number }> = ({
  name,
  why,
  activateAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activateFrame = activateAt * fps;
  const doneFrame = (activateAt + DONE_AFTER) * fps;

  const state: 'todo' | 'active' | 'done' =
    frame >= doneFrame ? 'done' : frame >= activateFrame ? 'active' : 'todo';

  const enter = interpolate(frame, [activateFrame - 10, activateFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderColor = state === 'todo' ? HAIRLINE : BRAND.colors.accent;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '22px 28px',
        backgroundColor: CARD_BG,
        border: `2px solid ${borderColor}`,
        borderRadius: BRAND.radius,
        opacity: interpolate(enter, [0, 1], [0.45, 1]),
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <Toggle state={state} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 30, color: BRAND.colors.text }}>
          {name}
        </div>
        <div style={{ fontWeight: BRAND.font.weights.regular, fontSize: 21, color: MUTED, lineHeight: 1.35 }}>
          {why}
        </div>
      </div>
      {state === 'done' && <DonePill />}
    </div>
  );
};

const Toggle: React.FC<{ state: 'todo' | 'active' | 'done' }> = ({ state }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (state === 'done') {
    return (
      <div style={{ ...base, backgroundColor: BRAND.colors.accent, color: BRAND.colors.bgBase }}>
        <span style={{ fontSize: 24, fontWeight: 800 }}>✓</span>
      </div>
    );
  }
  if (state === 'active') {
    const rot = (frame / fps) * 360; // spinner
    return (
      <div
        style={{
          ...base,
          border: `4px solid ${HAIRLINE}`,
          borderTopColor: BRAND.colors.accent,
          transform: `rotate(${rot}deg)`,
        }}
      />
    );
  }
  return <div style={{ ...base, border: `3px solid ${HAIRLINE}` }} />;
};

const DonePill: React.FC = () => (
  <div
    style={{
      padding: '6px 16px',
      borderRadius: 999,
      backgroundColor: 'rgba(139,38,53,0.12)',
      color: BRAND.colors.accent,
      fontWeight: BRAND.font.weights.bold,
      fontSize: 16,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}
  >
    Done
  </div>
);
