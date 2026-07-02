import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ComparisonChatsContent } from './content-types';
import { ToolMark } from './ToolMark';
import { BRAND, SHADOW } from '../../brand/tokens';
import { SceneFrame, Eyebrow, renderAccented, useGlideIn, MUTED, SimDisclaimer } from './shared';
import { TypeOn, Pinwheel, Tether } from './primitives';

const ROW_W = 1680; // 1920 − 2×120 paddingX
// 472 (was 600): with eyebrow+title+caption all present, the fixed-height card
// row's bottom edge measured ~122px from the frame bottom at WIN_H=600 — inside
// the LessonChrome dots/counter band (defect: composer "Ask anything…" row and
// the crimson tether drawn through the pagination dots, 11 lessons). Shrunk so
// the card bottom clears CONTENT_SAFE_BOTTOM in that worst case.
const WIN_H = 472;
const GAP = 28;

/** Smooth wavy path connecting the bottom of each window — the tether. */
function tetherPath(n: number): string {
  const w = (ROW_W - (n - 1) * GAP) / n;
  const cx = (i: number) => i * (w + GAP) + w / 2;
  const y = WIN_H - 6;
  let d = `M ${cx(0)} ${y}`;
  for (let i = 1; i < n; i++) {
    const midX = (cx(i - 1) + cx(i)) / 2;
    d += ` Q ${midX} ${y + 46} ${cx(i)} ${y}`;
  }
  return d;
}

/**
 * `comparison-chats` (v2) — the signature Topic-1 scene. 2–4 card-white chat
 * windows float in side by side (deep window shadow = the "alive" depth), each
 * showing the SAME prompt centered, a thinking pinwheel, then that tool's
 * response typing in. A crimson tether draws across the composers to make the
 * "same prompt → different voices" point physical. All motion settles in the
 * first ~7s; the scene then holds (narration runs long).
 */
export const ComparisonChats: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as ComparisonChatsContent;
  const title = useGlideIn(10, 22);
  const caption = useGlideIn(150, 16);
  const n = c.tools.length;
  const tetherStart = Math.min(165, Math.floor(scene.duration * 0.6));

  return (
    <SceneFrame align="flex-start" paddingX={120}>
      <Eyebrow delay={4}>{c.eyebrow}</Eyebrow>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 64,
          letterSpacing: '-0.025em',
        }}
      >
        {renderAccented(c.title)}
      </h1>

      {c.caption && (
        <div style={{ ...caption, marginTop: 6, fontSize: 26, fontStyle: 'italic', color: MUTED }}>
          {renderAccented(c.caption)}
        </div>
      )}

      <div style={{ position: 'relative', width: ROW_W, height: WIN_H, marginTop: 8 }}>
        <SimDisclaimer text={c.disclaimer} style={{ position: 'absolute', top: -34, right: 0 }} />
        <div style={{ display: 'flex', gap: GAP, width: '100%', height: '100%' }}>
          {c.tools.map((tool, i) => (
            <ChatWindow
              key={tool.id}
              name={tool.name}
              prompt={c.prompt}
              response={tool.response}
              delay={12 + i * 8}
            />
          ))}
        </div>
        {c.tether !== false && n > 1 && (
          <Tether
            d={tetherPath(n)}
            startFrame={tetherStart}
            drawFrames={42}
            strokeWidth={3}
            width={ROW_W}
            height={WIN_H + 60}
          />
        )}
      </div>
    </SceneFrame>
  );
};

const ChatWindow: React.FC<{
  name: string;
  prompt: string;
  response: string;
  delay: number;
}> = ({ name, prompt, response, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glide = useGlideIn(delay, 40);

  const typeStart = Math.round(2 * fps);
  const typeEnd = Math.round(5 * fps);
  const thinking = frame > delay + 24 && frame < typeStart;

  // Idle breathe so the cluster never reads frozen during the long hold —
  // a sub-2px frame-driven sine, phase-staggered by the card's own delay,
  // composed onto the glide transform (transform-only, no layout reflow).
  const breatheY = Math.sin(frame * 0.04 + delay) * 1.5;

  return (
    <div
      style={{
        ...glide,
        transform: `${glide.transform} translateY(${breatheY}px)`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: BRAND.colors.bgCard,
        border: `1px solid ${BRAND.colors.border}`,
        borderRadius: BRAND.radiusWindow,
        boxShadow: SHADOW.window,
      }}
    >
      {/* header: mark + name + dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 22px',
          borderBottom: `1px solid ${BRAND.colors.border}`,
        }}
      >
        <ToolMark name={name} size={26} />
        <div style={{ flex: 1, fontWeight: BRAND.font.weights.bold, fontSize: 24, letterSpacing: '-0.01em' }}>
          {name}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: BRAND.colors.borderStrong }} />
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '22px 24px' }}>
        {/* prompt, as a centered neutral pill */}
        <div
          style={{
            alignSelf: 'center',
            maxWidth: '92%',
            background: BRAND.colors.bgDark,
            color: BRAND.colors.text,
            borderRadius: BRAND.radiusWindow,
            padding: '12px 18px',
            fontSize: 18,
            lineHeight: 1.4,
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {prompt}
        </div>

        {/* response: pinwheel while thinking, then typed text */}
        <div style={{ minHeight: 30, fontSize: 20, lineHeight: 1.5, color: BRAND.colors.text }}>
          {thinking ? (
            <Pinwheel size={40} />
          ) : (
            <TypeOn text={response} startFrame={typeStart} durFrames={typeEnd - typeStart} caret={false} />
          )}
        </div>
      </div>

      {/* composer */}
      <div style={{ padding: '16px 22px 20px', borderTop: `1px solid ${BRAND.colors.border}` }}>
        <div
          style={{
            padding: '14px 18px',
            background: BRAND.colors.bgBase,
            borderRadius: BRAND.radiusWindow,
            fontSize: 17,
            color: BRAND.colors.textDim,
            fontWeight: 500,
          }}
        >
          Ask anything…
        </div>
      </div>
    </div>
  );
};
