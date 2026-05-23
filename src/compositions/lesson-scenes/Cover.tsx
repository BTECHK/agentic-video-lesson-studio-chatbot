import React from 'react';
import { interpolate } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { CoverContent } from './content-types';
import { BRAND, MUTED, SceneFrame, Eyebrow, Glide, useGlideIn, usePopIn, renderAccented } from './shared';

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
          fontWeight: BRAND.font.weights.extraBold,
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
          fontWeight: BRAND.font.weights.regular,
          fontSize: 30,
          lineHeight: 1.45,
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
            display: 'flex',
            gap: 48,
            marginTop: 24,
          }}
        >
          {c.stats.map((stat, i) => (
            <Stat key={stat.id} value={stat.value} suffix={stat.suffix} label={stat.label} delay={78 + i * 6} />
          ))}
        </div>
      )}
    </SceneFrame>
  );
};

const Stat: React.FC<{ value: number; suffix?: string; label: string; delay: number }> = ({
  value,
  suffix,
  label,
  delay,
}) => {
  const pop = usePopIn(delay);
  // Count-up over ~30 frames once the stat has popped in.
  const counted = Math.round(
    interpolate(pop.opacity, [0, 1], [0, value], { extrapolateRight: 'clamp' }),
  );
  return (
    <div style={{ ...pop, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontWeight: BRAND.font.weights.extraBold,
          fontSize: 64,
          color: BRAND.colors.accent,
          lineHeight: 1,
        }}
      >
        {counted}
        {suffix ? <span style={{ fontSize: 36 }}>{suffix}</span> : null}
      </div>
      <div
        style={{
          fontWeight: BRAND.font.weights.semiBold,
          fontSize: 22,
          color: MUTED,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
    </div>
  );
};
