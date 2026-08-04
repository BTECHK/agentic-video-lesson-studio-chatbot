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
import { BRAND, LEADING, SHADOW, MOTION, AMBIENT } from '../../brand/tokens';

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
 * Motion profile seam — 'v3' (default, unchanged renders) or 'v4' (scene-exit
 * glides, word-synced reveals, per-topic cover variants). Read via
 * `useMotionProfile()`; provided by `LessonVideo` from `lesson.lesson.motionProfile`.
 */
export const MotionProfileContext = React.createContext<'v3' | 'v4'>('v3');

/** Current lesson's motion profile — defaults to 'v3' outside a provider. */
export function useMotionProfile(): 'v3' | 'v4' {
  return React.useContext(MotionProfileContext);
}

/**
 * Eased glide progress (0..1) — explicit-duration cubic-out tween. Pure so the
 * hard-arrival contract is unit-testable (test/motion-easing.test.ts): unlike a
 * spring it reaches exactly 1.0 at `delay + dur` rather than asymptoting.
 */
export function glideProgress(frame: number, delay = 0, dur: number = MOTION.glide.dur): number {
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
export function useGlideIn(
  delay = 0,
  fromY: number = MOTION.glide.fromY,
  dur: number = MOTION.glide.dur,
): { opacity: number; transform: string } {
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
  const DUR = MOTION.pop.dur;
  const p = interpolate(frame, [delay, delay + DUR], [0, 1], {
    easing: Easing.out(Easing.back(MOTION.pop.overshoot)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`,
  };
}

/**
 * Eased scene-exit progress (1..0) — the v4 mirror of `glideProgress` for
 * OUTGOING scenes. Explicit-duration cubic-IN (accelerating) tween that holds
 * at 1.0 until the last `dur` frames of `duration`, then falls to exactly 0.0
 * at `duration`. Pure so it's unit-testable alongside `glideProgress`.
 */
export function exitProgress(frame: number, duration: number, dur: number = MOTION.exit.dur): number {
  return interpolate(frame, [duration - dur, duration], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
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
  const tint = dark ? AMBIENT.tint.dark : AMBIENT.tint.light;
  const [a1, a2] = dark ? AMBIENT.alpha.dark : AMBIENT.alpha.light;
  const [breath1, breath2] = AMBIENT.breathRate;
  const [ripple1, ripple2] = AMBIENT.rippleRate;
  const rippleAmp = AMBIENT.rippleAmp;
  const o1 = 0.45 + (Math.sin(t * breath1) * 0.5 + 0.5) * 0.4 + Math.sin(t * ripple1) * rippleAmp;
  const o2 = 0.45 + (Math.sin(t * breath2 + 2) * 0.5 + 0.5) * 0.4 + Math.sin(t * ripple2 + 1) * rippleAmp;
  const [d1, d2] = AMBIENT.drift;
  const layer = (dx: number, dy: number, pos: string, alpha: number, sz: number, op: number): React.CSSProperties => ({
    position: 'absolute',
    inset: -200,
    opacity: op,
    transform: `translate(${dx}px, ${dy}px)`,
    background: `radial-gradient(${sz}% ${sz}% at ${pos}, rgba(${tint},${alpha}), transparent 70%)`,
  });
  return (
    // data-decor: purely decorative ambient glow. Its inset:-200 layers overflow
    // this overflow:hidden box by design, so Gate L's clip rule would otherwise
    // flag it on every scene; the gate exempts decor ("watermarks may bleed").
    // Probe-only attribute — changes no rendered pixels.
    <AbsoluteFill data-decor style={{ overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={layer(Math.sin(t * d1.x) * d1.xAmp, Math.cos(t * d1.y) * d1.yAmp, d1.pos, a1, d1.size, o1)} />
      <div style={layer(Math.cos(t * d2.x) * d2.xAmp, Math.sin(t * d2.y) * d2.yAmp, d2.pos, a2, d2.size, o2)} />
    </AbsoluteFill>
  );
};

/**
 * Full-bleed warm-linen stage. Every lesson scene sits inside this. `justify`
 * defaults to the universal vertical centering every scene relies on; a
 * variable-height scene (AssignmentList, 2-6 tasks + optional callout) can
 * opt into `flex-start` so its top edge is a FIXED distance from the frame
 * top regardless of content length — centering a tall content block instead
 * only spends half of any height cut on moving the top down (the other half
 * is "wasted" there), making the bottom-clearance floor (CONTENT_SAFE_BOTTOM)
 * unreachable for long lists (defect: a 5-task lesson eyebrow-on-watermark
 * + callout-in-caption-band, wave-3b).
 */
export const SceneFrame: React.FC<{
  children: React.ReactNode;
  align?: 'center' | 'flex-start';
  paddingX?: number;
  justify?: 'center' | 'flex-start';
}> = ({ children, align = 'flex-start', paddingX = 160, justify = 'center' }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BRAND.colors.bgBase,
      fontFamily,
      color: BRAND.colors.text,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: justify,
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
 * Row gap for a vertically-stacked list (task rows, checklist rows) inside a
 * vertically-centered SceneFrame. A long list's total height can push its top
 * above the chrome watermark (defect: AssignmentList eyebrow over the "Sample
 * Academy" wordmark) or its bottom under the pagination/caption band (defect:
 * long callouts flush against the dots). Tightening the gap
 * for longer lists is safe whitespace compression — never font shrinking.
 */
export function listGap(itemCount: number, baseGap: number, tightGap: number): number {
  return itemCount >= 4 ? tightGap : baseGap;
}

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

/**
 * Canonical "Stylized simulation" honesty chip — the single label every tool-sim
 * (ComparisonChats, ToolDemo, ScreenFlow, VoiceDemo) renders so a stylized mock is
 * never mistaken for a real product screenshot. Crimson micro-caps on an accentSoft
 * fill, 4px radius, hairline accent border, low charcoal lift (never a glow, never a
 * full pill). Marked `data-decor` so the layout gate treats it as a non-text overlay
 * leaf that may sit over chrome. Callers pass `style` to pin it (e.g. top-right of a
 * window). Token-driven — to retune the look, edit the token, not this component.
 */
export const SimDisclaimer: React.FC<{
  text?: string;
  style?: React.CSSProperties;
}> = ({ text = 'Stylized simulation', style }) => (
  <div
    data-decor
    style={{
      fontFamily,
      fontWeight: BRAND.font.weights.semiBold,
      fontSize: 12,
      lineHeight: LEADING.caps,
      letterSpacing: '0.08em',
      color: BRAND.colors.accent,
      background: BRAND.colors.accentSoft,
      border: `1px solid ${BRAND.colors.accent}`,
      borderRadius: BRAND.radius,
      boxShadow: SHADOW.button,
      padding: '5px 10px',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {text}
  </div>
);

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
