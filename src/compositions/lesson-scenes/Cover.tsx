import React from 'react';
import { interpolate } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { CoverContent } from './content-types';
import { BRAND, SAFE_AREA } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, Glide, useGlideIn, usePopIn, useMotionProfile, renderAccented, sceneTitleStyle } from './shared';

/**
 * v4 per-topic cover variant (pure, unit-testable). Derives a stable 0–3 index
 * from the eyebrow/topic string (sum of char codes mod 4) so each topic's cover
 * gets a repeatable accent geometry without any content change. Deterministic,
 * spreads across all four buckets over the real eyebrow set (test/v4-scenes.test.ts).
 */
export function coverVariant(topic: string): 0 | 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < topic.length; i++) sum += topic.charCodeAt(i);
  return (sum % 4) as 0 | 1 | 2 | 3;
}

/**
 * `cover` — opening hero of every lesson. Eyebrow kicker, multi-line hero
 * title (each array entry is one line, `*word*` accented), sub-copy, and an
 * optional stat grid that counts up. Beats follow scene-catalog §cover.
 *
 * v4 recomposes these SAME elements into one of four per-topic layouts (accent
 * bar, stat alignment, title block position/width) — no new elements, colors,
 * or sizes, all within the SceneFrame's safe-area padding. v3 always renders
 * variant 0, byte-for-byte the pre-v4 layout.
 */
export const Cover: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as CoverContent;
  const sub = useGlideIn(48, 18);
  const statsContainer = useGlideIn(72, 16);
  const variant = useMotionProfile() === 'v4' ? coverVariant(c.eyebrow) : 0;

  return (
    <SceneFrame align="flex-start">
      {/* Variant 1: a full-height left accent bar anchoring the hero column. */}
      {variant === 1 && (
        <div
          aria-hidden
          data-decor
          style={{
            position: 'absolute',
            left: SAFE_AREA.x,
            top: 120,
            bottom: 120,
            width: BRAND.radius,
            backgroundColor: BRAND.colors.accent,
            borderRadius: BRAND.radius,
          }}
        />
      )}

      <Eyebrow delay={9}>{c.eyebrow}</Eyebrow>

      <h1
        style={{
          ...sceneTitleStyle(112),
          // Variant 2 drops the title block down a beat; variant 3 narrows it.
          marginTop: variant === 2 ? 24 : 0,
          maxWidth: variant === 3 ? 1040 : sceneTitleStyle(112).maxWidth,
        }}
      >
        {c.title.map((line, i) => (
          <Glide key={i} delay={16 + i * 12} fromY={28} style={{ display: 'block' }}>
            {renderAccented(line)}
          </Glide>
        ))}
      </h1>

      <p
        style={{
          ...sub,
          margin: 0,
          fontWeight: BRAND.font.weights.medium,
          fontSize: 26,
          lineHeight: 1.5,
          color: MUTED,
          maxWidth: 1120,
        }}
      >
        {c.sub}
      </p>

      {c.stats && c.stats.length > 0 && (
        <div
          style={{
            ...statsContainer,
            display: variant === 3 ? 'flex' : 'grid',
            // Variant 3 stacks the stats vertically on the right; others keep the row.
            flexDirection: variant === 3 ? 'column' : undefined,
            alignItems: variant === 3 ? 'flex-end' : undefined,
            gridTemplateColumns: variant === 3 ? undefined : `repeat(${c.stats.length}, 1fr)`,
            // Variant 1 right-aligns the stat row; variant 2 widens its divider.
            justifyItems: variant === 1 ? 'end' : undefined,
            width: '100%',
            marginTop: variant === 2 ? 40 : 24,
            borderTop: `${variant === 2 ? 2 : 1}px solid ${BRAND.colors.borderStrong}`,
            borderBottom: `${variant === 2 ? 2 : 1}px solid ${BRAND.colors.borderStrong}`,
          }}
        >
          {c.stats.map((stat, i) => (
            <Stat
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={78 + i * 6}
              showDivider={variant !== 3 && i < c.stats!.length - 1}
              // Variants 1 & 3 right-align each stat's ink; 0 & 2 keep the
              // default column stretch (pixel-identical to the pre-v4 layout).
              align={variant === 1 || variant === 3 ? 'flex-end' : undefined}
            />
          ))}
        </div>
      )}
    </SceneFrame>
  );
};

const Stat: React.FC<{
  value: number;
  suffix?: string;
  label: string;
  delay: number;
  showDivider?: boolean;
  align?: 'flex-start' | 'flex-end';
}> = ({ value, suffix, label, delay, showDivider, align }) => {
  const pop = usePopIn(delay);
  // Count-up over ~30 frames once the stat has popped in.
  const counted = Math.round(
    interpolate(pop.opacity, [0, 1], [0, value], { extrapolateRight: 'clamp' }),
  );
  return (
    <div
      style={{
        ...pop,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: 6,
        padding: '36px 32px',
        borderRight: showDivider ? `1px solid ${BRAND.colors.border}` : 'none',
      }}
    >
      <div
        style={{
          fontWeight: BRAND.font.weights.semiBold,
          fontSize: 76,
          color: BRAND.colors.accent,
          lineHeight: 1,
          letterSpacing: '-0.015em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {counted}
        {suffix ? (
          <span style={{ fontSize: 30, fontWeight: BRAND.font.weights.regular, color: BRAND.colors.textMuted, marginLeft: 4 }}>
            {suffix}
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontWeight: BRAND.font.weights.semiBold,
          fontSize: 14,
          color: BRAND.colors.textMuted,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          marginTop: 18,
        }}
      >
        {label}
      </div>
    </div>
  );
};
