import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { SetupChecklistContent } from './content-types';
import { BRAND, SHADOW } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, SceneSub } from './shared';
import { Pinwheel, MockCursor } from './primitives';
import type { CursorKey } from './primitives';

const DONE_AFTER = 1.6; // seconds after activateAt a row flips to "Done"

// Layout constants — rows stack at fixed Y positions within the list container.
// The list starts ~360px below the top of SceneFrame's inner area.
// Each row is ~100px tall + 14px gap. First row top ≈ 360 in scene coords (for cursor Y).
const ROW_HEIGHT = 100;
const ROW_GAP = 14;
// Toggle button is at right edge minus ~60px; list left edge ≈ 160px (SceneFrame default paddingX).
const TOGGLE_X = 1740; // scene-absolute X for toggle column (near right)
const ROW_Y_FIRST = 460; // scene-absolute Y for first row toggle

/**
 * `setup-checklist` (v2) — sequential settings that each "light up" at
 * `activateAt`, showing an accent border + Pinwheel in the toggle slot, then
 * flip to "Done" 1.6s later (checkmark + accentSoft pill). If `content.cursor`
 * is true a MockCursor walks down to each item's toggle just before it activates.
 * All motion settles within the first ~10s then holds.
 */
export const SetupChecklist: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as SetupChecklistContent;
  const { fps } = useVideoConfig();

  // Build cursor keyframes: glide to each row just before its activateAt, click at activateAt.
  const cursorKeys: CursorKey[] = [];
  const cursorClicks: number[] = [];

  if (c.cursor) {
    // Start cursor parked at first toggle a beat before first activation.
    const firstActivate = c.items[0]?.activateAt ?? 2;
    cursorKeys.push({ frame: Math.round((firstActivate - 0.6) * fps), x: TOGGLE_X, y: ROW_Y_FIRST });

    c.items.forEach((item, i) => {
      const rowY = ROW_Y_FIRST + i * (ROW_HEIGHT + ROW_GAP);
      const arriveFrame = Math.round((item.activateAt - 0.18) * fps);
      const clickFrame = Math.round(item.activateAt * fps);
      cursorKeys.push({ frame: arriveFrame, x: TOGGLE_X, y: rowY });
      cursorClicks.push(clickFrame);
      // Hold on this row until next activation - 0.4s
      const nextAt = c.items[i + 1]?.activateAt;
      if (nextAt !== undefined) {
        cursorKeys.push({ frame: Math.round((nextAt - 0.45) * fps), x: TOGGLE_X, y: rowY });
      }
    });

    // After last row hold in place
    const lastItem = c.items[c.items.length - 1];
    if (lastItem) {
      const lastY = ROW_Y_FIRST + (c.items.length - 1) * (ROW_HEIGHT + ROW_GAP);
      cursorKeys.push({ frame: Math.round((lastItem.activateAt + DONE_AFTER + 1) * fps), x: TOGGLE_X, y: lastY });
    }
  }

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={66}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP, width: '100%', marginTop: 16 }}>
          {c.items.map((item) => (
            <ChecklistRow key={item.id} name={item.name} why={item.why} activateAt={item.activateAt} />
          ))}
        </div>

        {c.cursor && (
          <MockCursor keys={cursorKeys} clicks={cursorClicks} />
        )}
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

  // Entrance: rows glide in from a slight upward offset when activated.
  const enterProgress = spring({
    frame: frame - (activateFrame - 10),
    fps,
    config: { damping: 22, mass: 0.5 },
  });
  const hasEntered = frame >= activateFrame - 10;

  // Done transition: card gets accentSoft fill.
  const doneProgress = spring({
    frame: frame - doneFrame,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  const borderColor =
    state === 'active'
      ? BRAND.colors.accent
      : state === 'done'
      ? BRAND.colors.accent
      : BRAND.colors.border;

  const shadowVal = state === 'active' ? SHADOW.cardHover : 'none';

  const bgColor =
    state === 'done'
      ? `rgba(139,38,53,${interpolate(doneProgress, [0, 1], [0, 0.06])})`
      : BRAND.colors.bgCard;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '22px 28px',
        backgroundColor: BRAND.colors.bgCard,
        background: bgColor !== BRAND.colors.bgCard ? bgColor : BRAND.colors.bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: BRAND.radius,
        boxShadow: shadowVal,
        opacity: hasEntered ? interpolate(enterProgress, [0, 1], [0.45, 1]) : 0.45,
        transform: hasEntered
          ? `translateY(${interpolate(enterProgress, [0, 1], [8, 0])}px)`
          : 'translateY(8px)',
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
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (state === 'done') {
    return (
      <div style={{ ...base }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: BRAND.colors.accent,
            color: BRAND.colors.bgBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill={BRAND.colors.accent} />
            <path
              d="M5 9.5 L8 12 L13 6.5"
              stroke={BRAND.colors.bgCard}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (state === 'active') {
    return (
      <div style={{ ...base }}>
        <Pinwheel size={44} />
      </div>
    );
  }

  // todo: a muted toggle shape (off)
  return (
    <div style={{ ...base }}>
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: BRAND.colors.bgDark,
          position: 'relative',
          border: `1px solid ${BRAND.colors.border}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: BRAND.colors.bgCard,
            border: `1px solid ${BRAND.colors.border}`,
          }}
        />
      </div>
    </div>
  );
};

const DonePill: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      borderRadius: 999,
      backgroundColor: BRAND.colors.accentSoft,
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
