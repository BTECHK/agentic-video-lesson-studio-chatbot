import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { ToolCardRevealContent } from './content-types';
import { BRAND, SHADOW } from '../../brand/tokens';
import { MUTED, GLIDE, SceneFrame, Eyebrow, SceneTitle, SceneSub, useGlideIn } from './shared';
import { ToolMark } from './ToolMark';

/**
 * `tool-card-reveal` — a landscape of tools, each a card with a monogram,
 * name, tag, and one-liner. Cards glide up in sequence and briefly highlight
 * (accent border + lift) as they enter, then settle flat.
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
            logo={tool.logo}
            tag={tool.tag}
            oneliner={tool.oneliner}
            delay={48 + i * 16}
          />
        ))}
      </div>
    </SceneFrame>
  );
};

// Highlight window: enters at `delay`, peaks for ~1.3s (39 frames), then settles.
const HIGHLIGHT_RISE = 10;
const HIGHLIGHT_HOLD = 39; // ~1.3s at 30fps

const ToolCard: React.FC<{
  name: string;
  logo?: string;
  tag: string;
  oneliner: string;
  delay: number;
}> = ({ name, logo, tag, oneliner, delay }) => {
  const frame = useCurrentFrame();
  const glide = useGlideIn(delay, 36);

  // 0 → 1 on entry, holds, then back to 0 once the card has settled.
  const highlight = interpolate(
    frame,
    [delay, delay + HIGHLIGHT_RISE, delay + HIGHLIGHT_RISE + HIGHLIGHT_HOLD, delay + HIGHLIGHT_RISE + HIGHLIGHT_HOLD + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(...GLIDE) },
  );

  const isActive = highlight > 0.05;

  return (
    <div
      style={{
        ...glide,
        flex: 1,
        backgroundColor: BRAND.colors.bgCard,
        border: `1px solid ${isActive ? BRAND.colors.accent : BRAND.colors.border}`,
        borderRadius: BRAND.radius,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxSizing: 'border-box',
        // Combine glide translateY with the highlight lift — compound transforms
        // require a single `transform` string.
        transform: `${glide.transform} translateY(${interpolate(highlight, [0, 1], [0, -6])}px)`,
        boxShadow: isActive ? SHADOW.cardHover : 'none',
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
        }}
      >
        <ToolMark name={name} logo={logo} size={38} />
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
      <div style={{ fontWeight: BRAND.font.weights.bold, fontSize: 34, lineHeight: 1.05 }}>
        {name}
      </div>
      <div style={{ fontWeight: BRAND.font.weights.regular, fontSize: 21, lineHeight: 1.4, color: MUTED }}>
        {oneliner}
      </div>
    </div>
  );
};
