import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  type CalculateMetadataFunction,
} from 'remotion';
import { BRAND } from '../brand/tokens';
import { fontFamily, playfairFamily, renderAccented, Glide, Pop, usePopIn } from './lesson-scenes/shared';
import { TypeOn } from './lesson-scenes/primitives';
import { SIZZLE, type SizzleStoryboard } from './sizzle.storyboard';
import { ColoredToolMark, CHIP_W, CHIP_GAP, ICON_SIZE, CHIP_ROW_LEFT, CHIP_ROW_TOP } from './ColoredToolMark';

/**
 * SizzleManifesto — a FAITHFUL Remotion rebuild of the hand-crafted
 * "Sample Promo" sizzle (the 65.6s ElevenLabs/narrator-voice cut on
 * Drive), with the v2 visual polish. Six beats, deterministic timing, driven by
 * a voiceover+music track (public/sizzle/original-sizzle-audio.m4a;
 * not included in this repo, supply your own) timed to the sample copy. This replaces the earlier #74 montage
 * (SizzleReel.tsx), which was a different artifact.
 *
 * Motion model (the v2.2 "not a slideshow" pass): unlike a lesson scene — which
 * settles in ~7s and HOLDS so the still-frame layout gate can sample it — a promo
 * must stay ALIVE the whole way through. Two motion layers run continuously across
 * EVERY beat: (1) `AmbientGlows` drifts the warm radial light, (2) the active
 * progress dot in `Chrome` breathes. On top of that each beat plays its own
 * staged + semantic motion (type-on, draw-on strikethroughs/underlines, staggered
 * pop-ins, tool icons, a connector). Enforced by `gate:motion` (frame-diff
 * liveliness — no frozen stretch may exceed ~1.5s).
 *
 * Beats (aligned to the VO):
 *   1 hook        every lesson starts as an outline
 *   2 promise     outline in, finished lesson out
 *   3 different   how it works (does / replaces) + tools
 *   4 master      what the pipeline handles (stages)
 *   5 transform   DARK — manual→automated / one-off→repeatable
 *   6 cta         from outline to finished video
 */

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
export const SIZZLE_LABEL = 'OUTLINE TO VIDEO';
export const SIZZLE_DURATION = s(65.6); // matches original-sizzle-audio.m4a

export type SizzleManifestoFormat = '16:9' | '9:16';
export type SizzleManifestoProps = { format?: SizzleManifestoFormat };

interface Beat {
  id: string;
  from: number;
  dur: number;
}
// from/dur in frames, boundaries read off the original cut (~8/18/34/44/57s).
export const MANIFESTO_BEATS: Beat[] = [
  { id: 'hook', from: s(0), dur: s(8) },
  { id: 'promise', from: s(8), dur: s(9.5) },
  { id: 'different', from: s(17.5), dur: s(16) },
  { id: 'master', from: s(33.5), dur: s(10) },
  { id: 'transform', from: s(43.5), dur: s(13.5) },
  { id: 'cta', from: s(57), dur: s(8.6) },
];

const STAGE_W = 1920;
const STAGE_H = 1080;
const MARGIN = 130;

// Rose accent for the dark transform beat (accent lightened for contrast on charcoal).
const ROSE = '#E7A6AE';
const DARK = '#191717';

/** `*…*` emphasis in ROSE — the dark-beat variant of `renderAccented` (whose
 *  crimson would read near-black on the charcoal transform background). */
const renderRoseAccented = (text: string): React.ReactNode[] =>
  text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      <span key={i} style={{ color: ROSE }}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );

export const sizzleManifestoMetadata: CalculateMetadataFunction<SizzleManifestoProps> = ({ props }) => {
  const format = props.format ?? '16:9';
  return {
    durationInFrames: SIZZLE_DURATION,
    fps: FPS,
    width: format === '9:16' ? 1080 : 1920,
    height: format === '9:16' ? 1920 : 1080,
    props: { ...props, format },
  };
};

// ── shared atoms ────────────────────────────────────────────────────────────

/**
 * Soft accent-tinted radial glows that DRIFT continuously — the warmth that keeps
 * the linen alive even during a beat's hold. Two oversized layers translate on
 * slow, out-of-phase sinusoids (transform-only, render-cheap). This is motion
 * layer #1 of the "never frozen" contract.
 */
const AmbientGlows: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const tint = dark ? '231,166,174' : '139,38,53';
  const a1 = dark ? 0.13 : 0.09;
  const a2 = dark ? 0.08 : 0.06;
  // Each layer drifts AND breathes opacity, out of phase — the warm light is never
  // still, so no beat (even a 16s hold) ever reads as a frozen frame. A faster
  // ripple is mixed in so the breath never flatlines at a slow-sine peak.
  const o1 = 0.5 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 0.38 + Math.sin(t * 3.3) * 0.08;
  const o2 = 0.5 + (Math.sin(t * 0.55 + 2) * 0.5 + 0.5) * 0.38 + Math.sin(t * 2.7 + 1) * 0.08;
  const layer = (dx: number, dy: number, pos: string, alpha: number, sz: number, op: number): React.CSSProperties => ({
    position: 'absolute',
    inset: -200,
    opacity: op,
    transform: `translate(${dx}px, ${dy}px)`,
    background: `radial-gradient(${sz}% ${sz}% at ${pos}, rgba(${tint},${alpha}), transparent 70%)`,
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={layer(Math.sin(t * 0.45) * 80, Math.cos(t * 0.37) * 52, '80% 24%', a1, 48, o1)} />
      <div style={layer(Math.cos(t * 0.31) * 90, Math.sin(t * 0.4) * 60, '12% 88%', a2, 42, o2)} />
    </AbsoluteFill>
  );
};

/**
 * Gentle, perpetual vertical bob — keeps content alive through a long beat's hold.
 * Uses `translate3d` + `willChange:'transform'` so the bob is GPU-composited as a
 * smooth sub-pixel transform instead of snapping to the pixel grid (the old
 * `translateY` rasterized into a freeze-then-jump stair-step). Amplitude ~11 and
 * speed ~0.85 keep the per-frame motion supra-pixel across a settled hold.
 */
const Float: React.FC<{ i?: number; amp?: number; speed?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  i = 0,
  amp = 11,
  speed = 0.85,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const y = Math.sin((frame / FPS) * speed + i * 0.9) * amp;
  return <div style={{ transform: `translate3d(0, ${y}px, 0)`, willChange: 'transform', ...style }}>{children}</div>;
};

/** Spring-driven line that draws itself on (scaleX/scaleY) — semantic "forward motion". */
const DrawLine: React.FC<{
  delay?: number;
  length?: number | string;
  thickness?: number;
  color?: string;
  vertical?: boolean;
  style?: React.CSSProperties;
}> = ({ delay = 0, length = '100%', thickness = 3, color = BRAND.colors.accent, vertical = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 26, mass: 0.7 } });
  return (
    <div
      style={{
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        background: color,
        borderRadius: BRAND.radius,
        transform: vertical ? `scaleY(${p})` : `scaleX(${p})`,
        transformOrigin: vertical ? 'top' : 'left',
        ...style,
      }}
    />
  );
};

/** Text with a strikethrough that DRAWS across it after the text lands — "we reject this". */
const Strike: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, color = BRAND.colors.accent, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 28, mass: 0.7 } });
  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      {children}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: '54%',
          width: '100%',
          height: 2,
          background: color,
          transform: `scaleX(${p})`,
          transformOrigin: 'left',
        }}
      />
    </span>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = BRAND.colors.accent,
  delay = 4,
}) => (
  <Glide delay={delay} fromY={12} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <DrawLine delay={delay + 2} length={40} thickness={3} color={color} />
    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  </Glide>
);

const Wordmark: React.FC<{ size?: number; dark?: boolean }> = ({ size = 132, dark }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1 }}>
    <span style={{ color: dark ? ROSE : BRAND.colors.accent }}>Sample</span>
    <span style={{ color: dark ? '#F2EDE8' : BRAND.colors.text, fontWeight: 700, marginLeft: size * 0.06 }}>Academy</span>
  </div>
);

// ── beats ───────────────────────────────────────────────────────────────────

const Hook: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.colors.bgBase }}>
    <AmbientGlows />
    <div style={{ position: 'absolute', left: MARGIN, top: STAGE_H * 0.42 }}>
      <Glide delay={6} fromY={16}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND.colors.accent }}>
          Every lesson starts as an outline
        </div>
      </Glide>
      <div style={{ marginTop: 28, fontSize: 30, fontWeight: 500, color: BRAND.colors.textMuted, letterSpacing: '0.02em' }}>
        <TypeOn text={'“Then someone has to make the video.”'} startFrame={26} durFrames={42} />
      </div>
    </div>
  </AbsoluteFill>
);

export const Promise: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
    <AmbientGlows />
    <Pop delay={4} style={{ textAlign: 'center' }}>
      <Wordmark size={120} />
    </Pop>
    <Glide delay={16} fromY={16} style={{ marginTop: 26, fontSize: 20, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.colors.accent, textAlign: 'center' }}>
      What the pipeline does
    </Glide>
    <Glide delay={26} fromY={20} style={{ marginTop: 30, maxWidth: 1280, textAlign: 'center', fontFamily: playfairFamily, fontSize: 52, fontWeight: 600, lineHeight: 1.18, letterSpacing: '-0.01em', color: BRAND.colors.text }}>
      {renderAccented("Write the *outline*. The pipeline turns it into a *finished video lesson*.")}
    </Glide>
    <DrawLine delay={44} length={300} thickness={3} style={{ marginTop: 34 }} />
  </AbsoluteFill>
);

export const Different: React.FC<{ sb?: SizzleStoryboard }> = ({ sb = SIZZLE }) => {
  const { doItems, notItems, tools } = sb.different;
  return (
    <AbsoluteFill style={{ background: BRAND.colors.bgBase, padding: `0 ${MARGIN}px`, justifyContent: 'center' }}>
      <AmbientGlows />
      <div style={{ marginBottom: 50 }}>
        <Eyebrow delay={2}>How it works</Eyebrow>
      </div>
      <div style={{ display: 'flex', gap: 80 }}>
        {/* What it does — items glide in over a left rule that draws top→bottom. */}
        <div style={{ flex: 1, position: 'relative', paddingLeft: 32 }}>
          <DrawLine delay={8} vertical length={172} thickness={3} color={BRAND.colors.accent} style={{ position: 'absolute', left: 0, top: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.colors.accent, marginBottom: 24 }}>What it does</div>
          {doItems.map((t, i) => {
            // The "Built by practitioners, for learners" line (last do-item, spoken in
            // this beat's VO) gets hero emphasis: larger + accented, not a buried bullet.
            const hero = i === doItems.length - 1;
            return (
              <Glide
                key={i}
                delay={12 + i * 6}
                fromY={16}
                style={
                  hero
                    ? { fontSize: 40, fontWeight: 700, color: BRAND.colors.accent, marginTop: 8, marginBottom: 16, letterSpacing: '-0.015em', lineHeight: 1.12 }
                    : { fontSize: 30, fontWeight: 600, color: BRAND.colors.text, marginBottom: 16, letterSpacing: '-0.01em' }
                }
              >
                {renderAccented(t)}
              </Glide>
            );
          })}
        </div>
        {/* What it replaces — each item lands, then a strikethrough draws across it. */}
        <div style={{ flex: 1, position: 'relative', paddingLeft: 32 }}>
          <DrawLine delay={16} vertical length={172} thickness={3} color={BRAND.colors.borderStrong} style={{ position: 'absolute', left: 0, top: 0 }} />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.colors.textMuted, marginBottom: 24 }}>What it replaces</div>
          {notItems.map((t, i) => (
            <Glide key={i} delay={18 + i * 6} fromY={16} style={{ marginBottom: 16 }}>
              <Strike delay={26 + i * 6} color={BRAND.colors.accent} style={{ fontSize: 30, fontWeight: 500, color: BRAND.colors.textDim }}>
                {t}
              </Strike>
            </Glide>
          ))}
        </div>
      </div>
      {/* Tool chips with their BRAND-COLORED marks — pop in staggered, a connector
          draws beneath. The row is ABSOLUTELY pinned at CHIP_ROW_LEFT/CHIP_ROW_TOP
          with fixed chip width + gap so each icon's glyph bbox is at a
          deterministic (x,y) for the icon-check; icon sits at the chip's LEFT. */}
      <div style={{ position: 'absolute', left: CHIP_ROW_LEFT, top: CHIP_ROW_TOP }}>
        <div style={{ display: 'flex', gap: CHIP_GAP }}>
          {tools.map((t, i) => (
            <Float key={i} i={i} amp={14} speed={2.4}>
              <Pop
                delay={34 + i * 4}
                style={{ boxSizing: 'border-box', width: CHIP_W, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: BRAND.colors.bgCard, border: `1px solid ${BRAND.colors.border}`, borderRadius: 999, fontSize: 22, fontWeight: 600, color: BRAND.colors.text, boxShadow: '0 4px 12px rgba(28,28,28,0.04)' }}
              >
                <span style={{ display: 'flex', flex: '0 0 auto' }}>
                  <ColoredToolMark name={t.name} color={t.color} size={ICON_SIZE} />
                </span>
                {t.name}
              </Pop>
            </Float>
          ))}
        </div>
        <DrawLine delay={50} length={'100%'} thickness={3} color={BRAND.colors.accent} style={{ marginTop: 16, opacity: 1 }} />
      </div>
    </AbsoluteFill>
  );
};

const MasterItem: React.FC<{ n: string; title: string; sub: string; delay: number }> = ({ n, title, sub, delay }) => {
  const bonus = n === '✦';
  return (
    <Glide delay={delay} fromY={16} style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
      <Pop delay={delay} style={{ width: 56 }}>
        <span style={{ fontSize: bonus ? 26 : 34, fontWeight: 800, color: BRAND.colors.accent, letterSpacing: '-0.02em' }}>{n}</span>
      </Pop>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: BRAND.colors.text, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ fontSize: 21, fontWeight: 500, color: BRAND.colors.textMuted }}>{sub}</span>
      </div>
    </Glide>
  );
};

export const Master: React.FC = () => {
  const items: [string, string, string][] = [
    ['01', 'Outline in', 'A structured outline, validated against the schema'],
    ['02', 'Plan and script', 'A lesson plan and narration drafted from the outline'],
    ['03', 'Scenes from data', 'Every scene type renders from JSON'],
    ['04', 'Voice and music', 'TTS narration mixed to the scene timing'],
    ['✦', 'Automated quality gates', 'Motion, media and layout checks on every render'],
    ['✦', 'Publish-ready MP4', '1080p, 30fps, BT.709'],
  ];
  return (
    <AbsoluteFill style={{ background: BRAND.colors.bgBase, padding: `0 ${MARGIN}px`, justifyContent: 'center' }}>
      <AmbientGlows />
      <div style={{ marginBottom: 36 }}>
        <Eyebrow delay={2}>What the pipeline handles</Eyebrow>
      </div>
      <div style={{ display: 'flex' }}>
        {/* A rule that draws down the list as the items arrive. */}
        <DrawLine delay={8} vertical length={340} thickness={3} color={BRAND.colors.accentSoft} style={{ marginRight: 40 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map(([n, title, sub], i) => (
            <MasterItem key={i} n={n} title={title} sub={sub} delay={8 + i * 5} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TransformCol: React.FC<{ from: string; to: string; label: string; delay: number }> = ({ from, to, label, delay }) => {
  const pop = usePopIn(delay + 16);
  return (
    <Glide delay={delay} fromY={20} style={{ flex: 1 }}>
      <Strike delay={delay + 6} color={ROSE} style={{ fontSize: 32, fontWeight: 500, color: 'rgba(242,237,232,0.45)' }}>
        {from}
      </Strike>
      <Glide delay={delay + 12} fromY={10} style={{ fontSize: 30, color: ROSE, margin: '8px 0 6px' }}>
        ↓
      </Glide>
      {/* The payoff word pops in (easeOutBack-feel) after the old state is struck. */}
      <div style={{ ...pop, fontFamily: playfairFamily, fontSize: 80, fontWeight: 600, color: ROSE, letterSpacing: '-0.01em', lineHeight: 1, transformOrigin: 'left' }}>
        {to}
      </div>
      <Glide delay={delay + 22} fromY={12} style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(242,237,232,0.5)', marginTop: 22 }}>
        {label}
      </Glide>
    </Glide>
  );
};

export const Transform: React.FC<{ sb?: SizzleStoryboard }> = ({ sb = SIZZLE }) => {
  const { cols, tagline } = sb.transform;
  return (
    <AbsoluteFill style={{ background: DARK, padding: `0 ${MARGIN}px`, justifyContent: 'center' }}>
      <AmbientGlows dark />
      <div style={{ marginBottom: 40 }}>
        <Eyebrow delay={2} color={ROSE}>From outline to video</Eyebrow>
      </div>
      <div style={{ position: 'relative', paddingTop: 44 }}>
        <DrawLine delay={6} length={'100%'} thickness={1} color={'rgba(242,237,232,0.18)'} style={{ position: 'absolute', top: 0, left: 0 }} />
        {/* 3 columns — gap tightened from 90 to fit the restored 3rd column. */}
        <div style={{ display: 'flex', gap: 56 }}>
          {cols.map((c, i) => (
            <Float key={i} i={i * 2} amp={11} speed={0.85} style={{ flex: 1 }}>
              <TransformCol from={c.from} to={c.to} label={c.label} delay={10 + i * 10} />
            </Float>
          ))}
        </div>
      </div>
      {/* Closing tagline — legible linen line under the columns, `*…*`
          emphasis in ROSE (crimson would be too dark on charcoal). */}
      <Glide delay={40} fromY={16} style={{ marginTop: 44, maxWidth: 1400, alignSelf: 'center', textAlign: 'center', fontSize: 28, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.01em', color: '#F2EDE8' }}>
        {renderRoseAccented(tagline)}
      </Glide>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ sb?: SizzleStoryboard }> = ({ sb = SIZZLE }) => (
  <AbsoluteFill style={{ background: BRAND.colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
    <AmbientGlows />
    <Pop delay={2}>
      <Wordmark size={150} />
    </Pop>
    <Glide delay={12} fromY={18} style={{ marginTop: 30, fontFamily: playfairFamily, fontSize: 56, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center', color: BRAND.colors.text }}>
      {renderAccented('From outline to *finished video.*')}
    </Glide>
    <Glide delay={20} fromY={14} style={{ marginTop: 28, fontSize: 22, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.colors.textMuted }}>
      Sample pipeline · Demo build
    </Glide>
    <DrawLine delay={26} length={320} thickness={3} style={{ marginTop: 26 }} />
    {/* Call-to-action line — accent, Syne, drawn from the storyboard (data-driven). */}
    <Glide delay={32} fromY={12} style={{ marginTop: 26, fontSize: 26, fontWeight: 600, letterSpacing: '0.02em', color: BRAND.colors.accent, textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 6 }}>
      {(sb.cta ?? SIZZLE.cta)!.apply}
    </Glide>
  </AbsoluteFill>
);

const BEAT_COMPONENT: Record<string, React.FC> = {
  hook: Hook,
  promise: Promise,
  different: Different,
  master: Master,
  transform: Transform,
  cta: CTA,
};

// ── chrome ──────────────────────────────────────────────────────────────────

const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  let active = MANIFESTO_BEATS.findIndex((b) => frame >= b.from && frame < b.from + b.dur);
  if (active < 0) active = MANIFESTO_BEATS.length - 1;
  const dark = MANIFESTO_BEATS[active].id === 'transform';
  const muted = dark ? 'rgba(242,237,232,0.55)' : BRAND.colors.textMuted;
  const accent = dark ? ROSE : BRAND.colors.accent;
  // Motion layer #2 of the "never frozen" contract: the active dot breathes.
  const breathe = 0.7 + (Math.sin((frame / FPS) * Math.PI * 1.4) * 0.5 + 0.5) * 0.3;
  return (
    <AbsoluteFill style={{ fontFamily, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: MARGIN, top: 56, display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 26, letterSpacing: '-0.02em' }}>
        <span style={{ color: accent, fontWeight: 800 }}>Sample</span>
        <span style={{ color: muted, fontWeight: 400, fontSize: 22 }}>Academy</span>
      </div>
      <div style={{ position: 'absolute', right: MARGIN, top: 62, fontFamily: BRAND.font.mono, fontSize: 16, fontWeight: 600, letterSpacing: '0.16em', color: muted }}>{SIZZLE_LABEL}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {MANIFESTO_BEATS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === active ? 26 : 7,
              height: 7,
              borderRadius: 4,
              background: i === active ? accent : i < active ? (dark ? 'rgba(231,166,174,0.5)' : 'rgba(139,38,53,0.5)') : (dark ? 'rgba(242,237,232,0.25)' : BRAND.colors.borderStrong),
              opacity: i === active ? breathe : 1,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FadeIn: React.FC<{ children: React.ReactNode; frames?: number }> = ({ children, frames = 14 }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, frames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Stage: React.FC = () => (
  // Syne is the inherited default for ALL beat text (labels, body, chips). Playfair
  // overrides only on the big marketing headlines; mono on the chrome label. Without
  // this, beats fell back to the browser default serif (Times) — the "not Syne" drift.
  <AbsoluteFill style={{ fontFamily }}>
    {MANIFESTO_BEATS.map((b, i) => {
      const Comp = BEAT_COMPONENT[b.id];
      // Overlap each beat 14f into the next for a cross-dissolve.
      return (
        <Sequence key={b.id} from={b.from} durationInFrames={b.dur + (i < MANIFESTO_BEATS.length - 1 ? 14 : 0)}>
          <FadeIn>
            <Comp />
          </FadeIn>
        </Sequence>
      );
    })}
    <Chrome />
  </AbsoluteFill>
);

export const SizzleManifesto: React.FC<SizzleManifestoProps> = ({ format = '16:9' }) => {
  const { width, height } = useVideoConfig();
  const portrait = format === '9:16' || height > width;
  const audio = <Audio src={staticFile('sizzle/original-sizzle-audio.m4a')} />;

  if (!portrait) {
    return (
      <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase }}>
        {audio}
        <Stage />
      </AbsoluteFill>
    );
  }

  // 9:16 — frame the 16:9 stage as a centered band on linen.
  const scale = width / STAGE_W;
  const bandH = STAGE_H * scale;
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase, justifyContent: 'center', alignItems: 'center' }}>
      {audio}
      {/* The same breathing warmth fills the portrait letterbox, so the 9:16 cut is
          alive edge-to-edge instead of a lively band marooned on dead linen. */}
      <AmbientGlows />
      <div style={{ width, height: bandH, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: STAGE_W, height: STAGE_H, position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Stage />
        </div>
      </div>
    </AbsoluteFill>
  );
};
