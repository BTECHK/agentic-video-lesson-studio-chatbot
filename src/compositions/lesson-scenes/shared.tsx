import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';
import { BRAND, LEADING, space } from '../../brand/tokens';

/**
 * Load Syne from the bundled local TTF instead of Google Fonts, so unattended
 * batch renders never depend on network reachability — a single gstatic DNS blip
 * otherwise fails the whole frame (ERR_NAME_NOT_RESOLVED) and can hang the render
 * until the watchdog kills it. `.catch` continues the render with the system font
 * rather than hanging forever if the local face ever fails to parse.
 */
const fontFamily = 'Syne';
if (typeof document !== 'undefined') {
  const handle = delayRender('load-syne-local');
  new FontFace(fontFamily, `url(${staticFile('fonts/Syne-Variable.ttf')}) format('truetype')`, {
    weight: '400 800',
  })
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch(() => continueRender(handle));
}

export { fontFamily, BRAND };

// Anthropic "glide" easing — the motion contract reference for non-spring tweens.
export const GLIDE = [0.16, 1, 0.3, 1] as const;

/** Faint, supporting tone for secondary copy on the warm linen base. */
export const MUTED = 'rgba(28,28,28,0.62)';
export const HAIRLINE = 'rgba(28,28,28,0.12)';

/**
 * Spring-driven glide-in: fade + upward translate. Scene-relative `delay` in
 * frames staggers elements per the scene-catalog beats. Mirrors the spring
 * feel of TitleCard / useSpringFadeIn but with a configurable travel distance.
 */
export function useGlideIn(delay = 0, fromY = 24): { opacity: number; transform: string } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, mass: 0.5 },
  });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [fromY, 0])}px)`,
  };
}

/** Pop-in scale used for dots, pills, badges. */
export function usePopIn(delay = 0): { opacity: number; transform: string } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.6 },
  });
  return {
    opacity: interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(progress, [0, 1], [0.6, 1])})`,
  };
}

/** Wrapper that glides its children in — use inside `.map()` to stagger lists. */
export const Glide: React.FC<{
  delay?: number;
  fromY?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, fromY = 24, style, children }) => {
  const g = useGlideIn(delay, fromY);
  return <div style={{ ...g, ...style }}>{children}</div>;
};

/** Wrapper that pops its children in — for dots, pills, badges in lists. */
export const Pop: React.FC<{
  delay?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, style, children }) => {
  const p = usePopIn(delay);
  return <div style={{ ...p, ...style }}>{children}</div>;
};

/**
 * Render `*word*` spans in the brand accent color. Used by titles/quotes that
 * mark emphasis inline (scene-catalog convention).
 */
export function renderAccented(text: string): React.ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <span key={i} style={{ color: BRAND.colors.accent }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Full-bleed warm-linen stage. Every lesson scene sits inside this. */
export const SceneFrame: React.FC<{
  children: React.ReactNode;
  align?: 'center' | 'flex-start';
  paddingX?: number;
}> = ({ children, align = 'flex-start', paddingX = 160 }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BRAND.colors.bgBase,
      fontFamily,
      color: BRAND.colors.text,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: align,
      padding: `120px ${paddingX}px`,
      gap: 40,
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * Pure style builders — exported so the typography contract is unit-testable
 * (#72): leading comes from the LEADING scale, never hardcoded per component.
 */
export function eyebrowStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    fontWeight: BRAND.font.weights.bold,
    fontSize: 22,
    lineHeight: LEADING.caps,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: BRAND.colors.accent,
  };
}

export function sceneTitleStyle(size: number): React.CSSProperties {
  return {
    margin: 0,
    fontWeight: BRAND.font.weights.extraBold,
    fontSize: size,
    lineHeight: LEADING.display,
    letterSpacing: '-0.02em',
    maxWidth: 1400,
  };
}

export function sceneSubStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontWeight: BRAND.font.weights.regular,
    fontSize: 30,
    lineHeight: LEADING.body,
    color: MUTED,
    maxWidth: 1100,
  };
}

/** Accent uppercase kicker that opens most scenes. */
export const Eyebrow: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 8,
}) => {
  const glide = useGlideIn(delay, 14);
  return (
    <div style={{ ...glide, ...eyebrowStyle() }}>
      <span
        style={{ width: space(10), height: space(1), backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
      />
      {children}
    </div>
  );
};

/** Primary scene title. */
export const SceneTitle: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 16, size = 84 }) => {
  const glide = useGlideIn(delay, 22);
  return <h1 style={{ ...glide, ...sceneTitleStyle(size) }}>{children}</h1>;
};

/** Supporting sub-copy under a title. */
export const SceneSub: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 28,
}) => {
  const glide = useGlideIn(delay, 18);
  return <p style={{ ...glide, ...sceneSubStyle() }}>{children}</p>;
};
