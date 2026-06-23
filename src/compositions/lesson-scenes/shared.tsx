import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  staticFile,
  delayRender,
  continueRender,
  cancelRender,
} from 'remotion';
import { BRAND, LEADING } from '../../brand/tokens';

/**
 * Load the brand faces (Syne + Playfair Display) from bundled local TTFs instead
 * of Google Fonts, so unattended batch renders never depend on network
 * reachability — a single gstatic DNS blip otherwise fails the whole frame
 * (ERR_NAME_NOT_RESOLVED) and can hang the render until the watchdog kills it.
 * Playfair Display drives the sizzle's marketing headlines (variable, 400–900).
 * JetBrains Mono is intentionally NOT bundled: captions/timecodes use the system
 * mono stack per the token comment.
 *
 * Render-determinism contract: a font load FAILURE must FAIL LOUD. The old
 * `.catch(continueRender)` silently substituted the system font, which is exactly
 * how a wrong font ships unnoticed — so on failure we `cancelRender(err)` to abort
 * with the error instead of masking it.
 *
 * `makeFaces` is injectable so the failure path is unit-testable (test/font-loader.test.ts).
 */
const fontFamily = 'Syne';
export const playfairFamily = 'Playfair Display';

type FontFaceLike = { load: () => Promise<FontFace> };

export function loadBrandFonts(
  makeFaces: () => FontFaceLike[] = () => [
    new FontFace(fontFamily, `url(${staticFile('fonts/Syne-Variable.ttf')}) format('truetype')`, {
      weight: '400 800',
    }),
    new FontFace(
      playfairFamily,
      `url(${staticFile('fonts/PlayfairDisplay-Variable.ttf')}) format('truetype')`,
      { weight: '400 900' },
    ),
  ],
): void {
  const handle = delayRender('load-brand-fonts-local');
  Promise.all(
    makeFaces().map((face) =>
      face.load().then((loaded) => {
        document.fonts.add(loaded as FontFace);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
}

if (typeof document !== 'undefined') {
  loadBrandFonts();
}

export { fontFamily, BRAND };

// Anthropic "glide" easing — the motion contract reference for non-spring tweens.
export const GLIDE = [0.16, 1, 0.3, 1] as const;

/** Faint, supporting tone for secondary copy on the warm linen base. */
export const MUTED = 'rgba(28,28,28,0.62)';
export const HAIRLINE = 'rgba(28,28,28,0.12)';

/**
 * Eased glide progress (0..1) — explicit-duration cubic-out tween. Pure so the
 * hard-arrival contract is unit-testable (test/motion-easing.test.ts): unlike a
 * spring it reaches exactly 1.0 at `delay + dur` rather than asymptoting.
 */
export function glideProgress(frame: number, delay = 0, dur = 18): number {
  return interpolate(frame, [delay, delay + dur], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Eased glide-in: fade + upward translate, lands hard (no spring tail). Scene-
 * relative `delay` in frames staggers elements per the scene-catalog beats;
 * `fromY` is the travel distance, `dur` the explicit tween length.
 */
export function useGlideIn(delay = 0, fromY = 24, dur = 18): { opacity: number; transform: string } {
  const frame = useCurrentFrame();
  const p = glideProgress(frame, delay, dur);
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [fromY, 0])}px)`,
  };
}

/**
 * Pop-in scale used for dots, pills, badges — the genuine "pop" atom. Eased
 * overshoot (back-out) that still LANDS at exactly scale 1.0 at `delay + DUR`,
 * with no asymptotic spring tail.
 */
export function usePopIn(delay = 0): { opacity: number; transform: string } {
  const frame = useCurrentFrame();
  const DUR = 16;
  const p = interpolate(frame, [delay, delay + DUR], [0, 1], {
    easing: Easing.out(Easing.back(1.6)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
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

/**
 * Drifting, breathing warm light behind every scene — the continuous ambient life
 * that keeps a narration-long teaching scene from reading as a frozen still during
 * its hold. Transform/opacity only, frame-driven; sits BEHIND content (moves no
 * text, so the layout gate is unaffected). A faster ripple is mixed into the breath
 * so it never flatlines. This is what `gate:motion` checks for.
 */
export const SceneAmbient: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tint = dark ? '231,166,174' : '139,38,53';
  const a1 = dark ? 0.12 : 0.07;
  const a2 = dark ? 0.08 : 0.05;
  const o1 = 0.45 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 0.4 + Math.sin(t * 3.1) * 0.08;
  const o2 = 0.45 + (Math.sin(t * 0.5 + 2) * 0.5 + 0.5) * 0.4 + Math.sin(t * 2.5 + 1) * 0.08;
  const layer = (dx: number, dy: number, pos: string, alpha: number, sz: number, op: number): React.CSSProperties => ({
    position: 'absolute',
    inset: -200,
    opacity: op,
    transform: `translate(${dx}px, ${dy}px)`,
    background: `radial-gradient(${sz}% ${sz}% at ${pos}, rgba(${tint},${alpha}), transparent 70%)`,
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={layer(Math.sin(t * 0.4) * 70, Math.cos(t * 0.33) * 48, '82% 22%', a1, 46, o1)} />
      <div style={layer(Math.cos(t * 0.3) * 84, Math.sin(t * 0.38) * 56, '14% 86%', a2, 40, o2)} />
    </AbsoluteFill>
  );
};

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
    <SceneAmbient />
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
    fontWeight: BRAND.font.weights.semiBold,
    fontSize: 14,
    lineHeight: LEADING.caps,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: BRAND.colors.accent,
  };
}

export function sceneTitleStyle(size: number): React.CSSProperties {
  return {
    margin: 0,
    fontWeight: BRAND.font.weights.bold,
    fontSize: size,
    lineHeight: LEADING.title,
    letterSpacing: '-0.025em',
    maxWidth: 1400,
  };
}

export function sceneSubStyle(): React.CSSProperties {
  return {
    margin: 0,
    fontWeight: BRAND.font.weights.medium,
    fontSize: 26,
    lineHeight: 1.5,
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
        style={{ width: 24, height: 2, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
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
  const glide = useGlideIn(delay, 30);
  return <h1 style={{ ...glide, ...sceneTitleStyle(size) }}>{children}</h1>;
};

/** Supporting sub-copy under a title. */
export const SceneSub: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 28,
}) => {
  const glide = useGlideIn(delay, 14);
  return <p style={{ ...glide, ...sceneSubStyle() }}>{children}</p>;
};
