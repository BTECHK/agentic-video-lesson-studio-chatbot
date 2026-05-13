import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  random,
} from 'remotion';
import { BRAND } from '../../brand/tokens';

const CIRCLE_SIZE = 50;
// Deterministic random offset for visual variety (NOT Math.random)
const VERTICAL_OFFSET = random('motion-seed') * 20 - 10;

export const MotionTestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Phase 1: Circle moves from left to center using spring
  const moveProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const startX = width * 0.15;
  const centerX = width / 2;
  const x = interpolate(moveProgress, [0, 1], [startX, centerX]);

  // Phase 2: Circle scales up after reaching center
  const scaleProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const scale = interpolate(scaleProgress, [0, 1], [1, 1.4]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: BRAND.colors.bgBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: '50%',
          backgroundColor: BRAND.colors.accent,
          position: 'absolute',
          left: x - CIRCLE_SIZE / 2,
          top: `calc(50% + ${VERTICAL_OFFSET}px)`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
};
