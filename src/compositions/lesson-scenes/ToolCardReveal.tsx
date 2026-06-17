import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ToolCardRevealContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, GLIDE, SceneFrame, Eyebrow, SceneTitle, SceneSub, useGlideIn } from './shared';
import { ToolMark } from './ToolMark';

const CARD_BG = '#F7F4EF';

/**
 * `tool-card-reveal` — a landscape of tools, each a card with a monogram,
 * name, tag, and one-liner. Cards glide up in sequence and briefly highlight
 * (accent border + lift) as they enter.
 */
export const ToolCardReveal: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as ToolCardRevealContent;

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={68}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={24}>{c.sub}</SceneSub>

      <div style={{ display: 'flex', gap: 28, width: '100%', marginTop: 32 }}>
        {c.tools.map((tool, i) => (
          <ToolCard
            key={tool.id}
            name={tool.name}
            tag={tool.tag}
            oneliner={tool.oneliner}
            delay={48 + i * 16}
          />
        ))}
      </div>
    </SceneFrame>
  );
};

const ToolCard: React.FC<{ name: string; tag: string; oneliner: string; delay: number }> = ({
  name,
  tag,
  oneliner,
  delay,
}) => {
  const frame = useCurrentFrame();
  const glide = useGlideIn(delay, 36);
  // Highlight ramps up as the card enters, then settles back to a hairline.
  const highlight = interpolate(
    frame,
    [delay, delay + 10, delay + 45],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(...GLIDE) },
  );

  return (
    <div
      style={{
        ...glide,
        flex: 1,
        backgroundColor: CARD_BG,
        border: `2px solid ${highlight > 0.05 ? BRAND.colors.accent : HAIRLINE}`,
        borderRadius: BRAND.radius,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        transform: `${glide.transform} translateY(${interpolate(highlight, [0, 1], [0, -6])}px)`,
        boxShadow: `0 ${interpolate(highlight, [0, 1], [4, 22])}px ${interpolate(
          highlight,
          [0, 1],
          [12, 44],
        )}px rgba(28,28,28,${interpolate(highlight, [0, 1], [0.05, 0.14])})`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: BRAND.radius,
          backgroundColor: BRAND.colors.accent,
          color: BRAND.colors.bgBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: BRAND.font.weights.extraBold,
          fontSize: 34,
        }}
      >
        <ToolMark name={name} size={38} />
      </div>
      <div
        style={{
          fontWeight: BRAND.font.weights.bold,
          fontSize: 15,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: BRAND.colors.accent,
        }}
      >
        {tag}
      </div>
      <div style={{ fontWeight: BRAND.font.weights.extraBold, fontSize: 34, lineHeight: 1.05 }}>
        {name}
      </div>
      <div style={{ fontWeight: BRAND.font.weights.regular, fontSize: 21, lineHeight: 1.4, color: MUTED }}>
        {oneliner}
      </div>
    </div>
  );
};
