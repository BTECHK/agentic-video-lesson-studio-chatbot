import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, SHADOW } from '../../brand/tokens';

/**
 * v2 motion primitives — Remotion ports of the Claude Design HTML prototype's
 * `lesson-ui.jsx`. Everything here is FRAME-DRIVEN (deterministic per
 * `useCurrentFrame`), never CSS-transition-driven, so batch renders and the
 * layout-gate still-capture are stable. Pure timing/geometry helpers are
 * exported separately so they unit-test without a render harness.
 */

// ── Pure helpers (unit-tested) ─────────────────────────────────────────────

/** Glide easing for continuous draws (tether, cursor segments, progress). */
export function easeInOutCubic(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Characters revealed by `frame` for a type-on of `len` over [start, start+dur]. */
export function typedCount(frame: number, startFrame: number, durFrames: number, len: number): number {
  if (frame <= startFrame) return 0;
  if (frame >= startFrame + durFrames || durFrames <= 0) return len;
  return Math.floor(((frame - startFrame) / durFrames) * len);
}

export type CursorKey = { frame: number; x: number; y: number };

/** Interpolated cursor position at `frame` across eased keyframe segments. */
export function cursorAt(keys: CursorKey[], frame: number): { x: number; y: number; visible: boolean } {
  if (keys.length === 0) return { x: 0, y: 0, visible: false };
  const first = keys[0];
  if (frame < first.frame) return { x: first.x, y: first.y, visible: false };
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return { x: last.x, y: last.y, visible: true };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const u = b.frame === a.frame ? 1 : easeInOutCubic((frame - a.frame) / (b.frame - a.frame));
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, visible: true };
    }
  }
  return { x: last.x, y: last.y, visible: true };
}

// ── TypeOn ─────────────────────────────────────────────────────────────────

/** Types a string out character-by-character with a blinking accent caret. */
export const TypeOn: React.FC<{
  text: string;
  startFrame?: number;
  durFrames?: number;
  caret?: boolean;
  style?: React.CSSProperties;
}> = ({ text, startFrame = 0, durFrames = 45, caret = true, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = typedCount(frame, startFrame, durFrames, text.length);
  const typing = frame > startFrame && frame < startFrame + durFrames;
  const blinkOn = Math.floor((frame / fps) * 2) % 2 === 0;
  const showCaret = caret && frame >= startFrame && (typing || frame < startFrame + durFrames + fps * 0.4);
  return (
    <span style={{ whiteSpace: 'pre-wrap', ...style }}>
      {text.slice(0, shown)}
      {showCaret && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '0.95em',
            marginLeft: 2,
            verticalAlign: '-0.12em',
            background: BRAND.colors.accent,
            opacity: blinkOn ? 1 : 0.25,
          }}
        />
      )}
    </span>
  );
};

// ── Pinwheel ───────────────────────────────────────────────────────────────

/** Semantic "thinking" ring — 8 dots with a stagger-fade sweep. */
export const Pinwheel: React.FC<{
  size?: number;
  color?: string;
  segments?: number;
  speed?: number;
  style?: React.CSSProperties;
}> = ({ size = 44, color = BRAND.colors.accent, segments = 8, speed = 1.4, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = size / 2;
  const r = size / 2 - size * 0.08;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      {Array.from({ length: segments }, (_, i) => {
        const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
        const phaseRaw = (t * speed - i / segments) % 1;
        const phase = phaseRaw < 0 ? phaseRaw + 1 : phaseRaw;
        return (
          <circle
            key={i}
            cx={c + r * Math.cos(angle)}
            cy={c + r * Math.sin(angle)}
            r={size * 0.06}
            fill={color}
            opacity={0.15 + phase * 0.85}
          />
        );
      })}
    </svg>
  );
};

// ── PulseRing ──────────────────────────────────────────────────────────────

/** Concentric rings expanding outward — "listening"/active feedback. */
export const PulseRing: React.FC<{
  size?: number;
  color?: string;
  rings?: number;
  style?: React.CSSProperties;
}> = ({ size = 80, color = BRAND.colors.accent, rings = 3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      {Array.from({ length: rings }, (_, i) => {
        const phaseRaw = (t * 0.9 - i / rings) % 1;
        const phase = phaseRaw < 0 ? phaseRaw + 1 : phaseRaw;
        return (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={phase * (size / 2 - 2)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={(1 - phase) * 0.6}
          />
        );
      })}
    </svg>
  );
};

// ── Tether ─────────────────────────────────────────────────────────────────

/**
 * Hand-drawn squiggle that draws itself in then holds — the object-permanence
 * connector. `pathLen` should OVERSHOOT the real path length (dashoffset →0
 * guarantees a full draw); undershoot would leave a dashed gap.
 */
export const Tether: React.FC<{
  d: string;
  startFrame?: number;
  drawFrames?: number;
  color?: string;
  strokeWidth?: number;
  pathLen?: number;
  width?: number;
  height?: number;
}> = ({
  d,
  startFrame = 0,
  drawFrames = 36,
  color = BRAND.colors.accent,
  strokeWidth = 3,
  pathLen = 3200,
  width = BRAND.video.width,
  height = BRAND.video.height,
}) => {
  const frame = useCurrentFrame();
  const eased = easeInOutCubic((frame - startFrame) / drawFrames);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLen}
        strokeDashoffset={pathLen * (1 - eased)}
      />
    </svg>
  );
};

// ── MockCursor ─────────────────────────────────────────────────────────────

/** Mouse pointer that glides between keyframes, with click pulses. */
export const MockCursor: React.FC<{
  keys: CursorKey[];
  clicks?: number[];
  color?: string;
}> = ({ keys, clicks = [], color = BRAND.colors.text }) => {
  const frame = useCurrentFrame();
  const { x, y, visible } = cursorAt(keys, frame);
  // Click pulse: a ring that expands/fades over ~0.4s after each click frame.
  const activeClick = clicks.find((cf) => frame >= cf && frame < cf + 12);
  const clickP = activeClick !== undefined ? (frame - activeClick) / 12 : -1;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: visible ? 1 : 0, zIndex: 50, pointerEvents: 'none' }}>
      {clickP >= 0 && (
        <span
          style={{
            position: 'absolute',
            left: -16,
            top: -16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${BRAND.colors.accent}`,
            transform: `scale(${0.4 + clickP * 1.1})`,
            opacity: 1 - clickP,
          }}
        />
      )}
      <svg
        width="26"
        height="26"
        viewBox="0 0 22 22"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.20))' }}
      >
        <path
          d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L13 11 Z"
          fill={BRAND.colors.bgCard}
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// ── Window + Composer ───────────────────────────────────────────────────────

const ThreeDots: React.FC = () => (
  <div style={{ display: 'flex', gap: 6 }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.colors.borderStrong }} />
    ))}
  </div>
);

/** The "Ask anything…" composer pill at the bottom of a chat window. */
export const Composer: React.FC<{ text?: string; typedFrames?: [number, number] }> = ({
  text,
  typedFrames,
}) => (
  <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${BRAND.colors.border}` }}>
    <div
      style={{
        padding: '14px 18px',
        background: BRAND.colors.bgBase,
        borderRadius: BRAND.radiusWindow,
        fontSize: 17,
        color: text ? BRAND.colors.text : BRAND.colors.textDim,
        fontWeight: 500,
        minHeight: 22,
      }}
    >
      {text && typedFrames ? (
        <TypeOn text={text} startFrame={typedFrames[0]} durFrames={typedFrames[1] - typedFrames[0]} />
      ) : (
        text || 'Ask anything…'
      )}
    </div>
  </div>
);

/**
 * Floating card-white window with a header (mark + title + dots), a body, and
 * an optional composer. The `shadowWindow` depth is what reads as "alive".
 */
export const Window: React.FC<{
  title?: string;
  mark?: React.ReactNode;
  children?: React.ReactNode;
  composer?: boolean | string;
  composerTyped?: [number, number];
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ title, mark, children, composer, composerTyped, style, bodyStyle }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: BRAND.colors.bgCard,
      border: `1px solid ${BRAND.colors.border}`,
      borderRadius: BRAND.radiusWindow,
      boxShadow: SHADOW.window,
      ...style,
    }}
  >
    {(title || mark) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 22px',
          borderBottom: `1px solid ${BRAND.colors.border}`,
        }}
      >
        {mark}
        <div style={{ flex: 1, fontWeight: BRAND.font.weights.bold, fontSize: 24, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <ThreeDots />
      </div>
    )}
    <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, ...bodyStyle }}>
      {children}
    </div>
    {composer ? (
      <Composer text={typeof composer === 'string' ? composer : undefined} typedFrames={composerTyped} />
    ) : null}
  </div>
);
