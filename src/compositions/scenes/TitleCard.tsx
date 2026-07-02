import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND, LEADING } from '../../brand/tokens';
import { fontFamily, renderAccented, SceneAmbient } from '../lesson-scenes/shared';

export const TitleCard: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame: local,
    fps,
    config: { damping: 18, mass: 0.6 },
  });

  const titleProgress = spring({
    frame: local - 15,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  const subtitleProgress = spring({
    frame: local - 30,
    fps,
    config: { damping: 22, mass: 0.5 },
  });

  const missionProgress = spring({
    frame: local - 50,
    fps,
    config: { damping: 24, mass: 0.5 },
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: BRAND.colors.bgBase,
        fontFamily,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        position: 'relative',
      }}
    >
      <SceneAmbient />
      {/* Growing crimson accent bar */}
      <div
        style={{
          width: interpolate(logoProgress, [0, 1], [0, 80]),
          height: 4,
          backgroundColor: BRAND.colors.accent,
          borderRadius: BRAND.radius,
        }}
      />

      {/* Academy name — "Sample" accented */}
      <div
        style={{
          opacity: logoProgress,
          transform: `translateY(${interpolate(logoProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: BRAND.font.weights.extraBold,
            fontSize: 96,
            color: BRAND.colors.text,
            textAlign: 'center',
            lineHeight: LEADING.display,
            letterSpacing: '-0.025em',
          }}
        >
          {renderAccented('*Sample* Academy')}
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: BRAND.font.weights.semiBold,
            fontSize: 32,
            color: BRAND.colors.accent,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          AI Education Platform
        </div>
      </div>

      {/* Sub-copy */}
      <div
        style={{
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          maxWidth: 720,
          padding: '0 40px',
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: BRAND.font.weights.regular,
            fontSize: 22,
            color: BRAND.colors.text,
            textAlign: 'center',
            lineHeight: LEADING.body,
            opacity: 0.62,
          }}
        >
          Powered by curated content, intelligent tutoring, and real-time comparisons
        </div>
      </div>

      {/* Mission line */}
      <div
        style={{
          opacity: missionProgress,
          transform: `translateY(${interpolate(missionProgress, [0, 1], [15, 0])}px)`,
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: BRAND.font.weights.bold,
            fontSize: 16,
            color: BRAND.colors.accent,
            textAlign: 'center',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          turning course outlines into finished video lessons
        </div>
      </div>
    </div>
  );
};
