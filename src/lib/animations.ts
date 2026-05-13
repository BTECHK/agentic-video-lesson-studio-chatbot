import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export function useSpringFadeIn(delay: number = 0) {
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

export function useSpringScale(delay: number = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });
  return {
    transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
    opacity: progress,
  };
}
