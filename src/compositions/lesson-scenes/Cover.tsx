import React from 'react';
import { interpolate } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { CoverContent } from './content-types';
import { BRAND } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, Glide, useGlideIn, usePopIn, renderAccented } from './shared';

/**
 * `cover` — opening hero of every lesson. Eyebrow kicker, multi-line hero
 * title (each array entry is one line, `*word*` accented), sub-copy, and an
 * optional stat grid that counts up. Beats follow scene-catalog §cover.
 */
export const Cover: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as CoverContent;
  const sub = useGlideIn(48, 18);
  const statsContainer = useGlideIn(72, 16);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={9}>{c.eyebrow}</Eyebrow>

      <h1
        style={{
          margin: 0,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 112,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          maxWidth: 1500,
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
            display: 'grid',
            gridTemplateColumns: `repeat(${c.stats.length}, 1fr)`,
            width: '100%',
            marginTop: 24,
            borderTop: `1px solid ${BRAND.colors.borderStrong}`,
            borderBottom: `1px solid ${BRAND.colors.borderStrong}`,
          }}
        >
          {c.stats.map((stat, i) => (
            <Stat
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={78 + i * 6}
              showDivider={i < c.stats!.length - 1}
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
}> = ({ value, suffix, label, delay, showDivider }) => {
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
