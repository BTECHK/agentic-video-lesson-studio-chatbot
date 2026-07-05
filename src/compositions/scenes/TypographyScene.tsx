import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';
import { BRAND } from '../../brand/tokens';

function useSpringFadeIn(delay: number = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, mass: 0.5 },
  });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
  };
}

// Load font at module level -- render-blocking, ensures font available before frame capture
const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

const WEIGHTS = [
  { weight: '400' as const, label: 'Regular (400)' },
  { weight: '600' as const, label: 'SemiBold (600)' },
  { weight: '800' as const, label: 'ExtraBold (800)' },
] as const;

export const TypographyScene: React.FC = () => {
  const anim0 = useSpringFadeIn(0);
  const anim1 = useSpringFadeIn(8);
  const anim2 = useSpringFadeIn(16);
  const anims = [anim0, anim1, anim2];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: BRAND.colors.bgBase,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      {WEIGHTS.map((w, i) => (
        <div key={w.weight} style={anims[i]}>
          <div
            style={{
              fontFamily,
              fontWeight: w.weight,
              fontSize: 72,
              color: BRAND.colors.text,
              textAlign: 'center',
            }}
          >
            Syne
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: BRAND.font.weights.regular,
              fontSize: 24,
              color: BRAND.colors.accent,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {w.label}
          </div>
        </div>
      ))}
    </div>
  );
};
