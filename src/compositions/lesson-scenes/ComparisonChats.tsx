import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ComparisonChatsContent } from './content-types';
import { ToolMark } from './ToolMark';
import {
  BRAND,
  MUTED,
  HAIRLINE,
  GLIDE,
  SceneFrame,
  Eyebrow,
  renderAccented,
  useGlideIn,
} from './shared';

const CARD_BG = '#F7F4EF';

/**
 * `comparison-chats` — the signature Topic-1 scene. 2–4 chat windows glide in
 * side by side, each showing the SAME prompt and that tool's response. The
 * response types out over ~3s so it has settled by the ~5s still frame.
 */
export const ComparisonChats: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as ComparisonChatsContent;
  const title = useGlideIn(10, 22);
  const caption = useGlideIn(120, 16);

  return (
    <SceneFrame align="flex-start" paddingX={120}>
      <Eyebrow delay={4}>{c.eyebrow}</Eyebrow>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.extraBold,
          fontSize: 62,
          letterSpacing: '-0.02em',
        }}
      >
        {renderAccented(c.title)}
      </h1>

      <div style={{ display: 'flex', gap: 28, width: '100%', marginTop: 24 }}>
        {c.tools.map((tool, i) => (
          <ChatWindow
            key={tool.id}
            name={tool.name}
            prompt={c.prompt}
            response={tool.response}
            delay={36 + i * 8}
          />
        ))}
      </div>

      {c.caption && (
        <div
          style={{
            ...caption,
            marginTop: 8,
            fontSize: 26,
            fontStyle: 'italic',
            color: MUTED,
          }}
        >
          {renderAccented(c.caption)}
        </div>
      )}
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
  const glide = useGlideIn(delay, 36);

  // Response types out between ~2s and ~4.3s scene-relative, so it has fully
  // settled by the ~5s still frame used for visual verification.
  const typeStart = 2 * fps;
  const typeEnd = 4.3 * fps;
  const shown = Math.round(
    interpolate(frame, [typeStart, typeEnd], [0, response.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(...GLIDE),
    }),
  );
  const typed = response.slice(0, shown);
  const thinking = frame < typeStart && frame > delay + 18;

  return (
    <div
      style={{
        ...glide,
        flex: 1,
        backgroundColor: CARD_BG,
        border: `2px solid ${HAIRLINE}`,
        borderRadius: BRAND.radius,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 420,
      }}
    >
      {/* window header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '20px 24px',
          borderBottom: `1px solid ${HAIRLINE}`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: BRAND.radius,
            backgroundColor: BRAND.colors.accent,
            color: BRAND.colors.bgBase,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: BRAND.font.weights.extraBold,
            fontSize: 22,
          }}
        >
          <ToolMark name={name} size={24} />
        </div>
        <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 26 }}>{name}</div>
      </div>

      {/* body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
          flex: 1,
        }}
      >
        {/* user prompt bubble (right-aligned) */}
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '85%',
            backgroundColor: BRAND.colors.accent,
            color: BRAND.colors.bgBase,
            borderRadius: BRAND.radius,
            padding: '12px 16px',
            fontSize: 19,
            lineHeight: 1.4,
          }}
        >
          {prompt}
        </div>

        {/* assistant response (left-aligned, typed) */}
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '92%',
            backgroundColor: BRAND.colors.bgBase,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: BRAND.radius,
            padding: '14px 18px',
            fontSize: 20,
            lineHeight: 1.45,
            color: BRAND.colors.text,
            minHeight: 28,
          }}
        >
          {thinking ? <ThinkingDots /> : typed}
        </div>
      </div>
    </div>
  );
};

const ThinkingDots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {[0, 1, 2].map((i) => {
        const t = (frame / fps) * 2 + i * 0.3;
        const opacity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
        return (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: MUTED,
              opacity,
              display: 'inline-block',
            }}
          />
        );
      })}
    </span>
  );
};
