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
import { fontFamily, renderAccented } from './lesson-scenes/shared';

/**
 * SizzleManifesto — a FAITHFUL Remotion rebuild of the hand-crafted
 * "Sample Promo" sizzle (the 65.6s ElevenLabs/narrator-voice cut on
 * Drive), with the v2 visual polish. Six beats, deterministic timing, driven by
 * a voiceover+music track (public/sizzle/original-sizzle-audio.m4a;
 * not included in this repo, supply your own) timed to the sample copy. This replaces the earlier #74 montage
 * (SizzleReel.tsx), which was a different artifact.
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

/** Soft accent-tinted radial glows — the warmth that makes the linen feel alive. */
const Glows: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? `radial-gradient(60% 60% at 80% 25%, rgba(231,166,174,0.10), transparent 70%), radial-gradient(50% 50% at 10% 90%, rgba(231,166,174,0.06), transparent 70%)`
        : `radial-gradient(55% 55% at 82% 28%, rgba(139,38,53,0.07), transparent 70%), radial-gradient(45% 45% at 8% 88%, rgba(139,38,53,0.05), transparent 70%)`,
    }}
  />
);

const useFade = (delay = 0, fromY = 22) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 24, mass: 0.6 } });
  return { opacity: p, transform: `translateY(${interpolate(p, [0, 1], [fromY, 0])}px)` };
};

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = BRAND.colors.accent,
  delay = 4,
}) => {
  const f = useFade(delay, 12);
  return (
    <div style={{ ...f, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ width: 40, height: 3, background: color, borderRadius: BRAND.radius }} />
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
        {children}
      </span>
    </div>
  );
};

const Wordmark: React.FC<{ size?: number; dark?: boolean }> = ({ size = 132, dark }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 800, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1 }}>
    <span style={{ color: dark ? ROSE : BRAND.colors.accent }}>Sample</span>
    <span style={{ color: dark ? '#F2EDE8' : BRAND.colors.text, fontWeight: 700, marginLeft: size * 0.06 }}>Academy</span>
  </div>
);

// ── beats ───────────────────────────────────────────────────────────────────

const Hook: React.FC = () => {
  const a = useFade(6, 16);
  const b = useFade(28, 16);
  return (
    <AbsoluteFill style={{ background: BRAND.colors.bgBase }}>
      <Glows />
      <div style={{ position: 'absolute', left: MARGIN, top: STAGE_H * 0.42 }}>
        <div style={{ ...a, fontSize: 34, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND.colors.accent }}>
          Every lesson starts as an outline
        </div>
        <div style={{ ...b, marginTop: 28, fontSize: 30, fontWeight: 500, color: BRAND.colors.textMuted, letterSpacing: '0.02em' }}>
          “Then someone has to make the video.”
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Promise: React.FC = () => (
  <AbsoluteFill style={{ background: BRAND.colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
    <Glows />
    <div style={{ ...useFade(4, 18), textAlign: 'center' }}>
      <Wordmark size={120} />
    </div>
    <div style={{ ...useFade(16, 16), marginTop: 26, fontSize: 20, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRAND.colors.accent, textAlign: 'center' }}>
      What the pipeline does
    </div>
    <div style={{ ...useFade(26, 20), marginTop: 30, maxWidth: 1280, textAlign: 'center', fontSize: 52, fontWeight: 700, lineHeight: 1.18, letterSpacing: '-0.02em', color: BRAND.colors.text }}>
      {renderAccented("Write the *outline*. The pipeline turns it into a *finished video lesson*.")}
    </div>
  </AbsoluteFill>
);

const Different: React.FC = () => {
  const doItems = ['Render lessons *straight from data*', 'Scripts, scenes and voice in one pass', 'Videos that build themselves'];
  const notItems = ['Screen-recording marathons', 'Hand-edited timelines', 'Copy-pasted slide decks'];
  const tools = ['Claude', 'ChatGPT', 'Gemini', 'Perplexity'];
  return (
    <AbsoluteFill style={{ background: BRAND.colors.bgBase, padding: `0 ${MARGIN}px`, justifyContent: 'center' }}>
      <Glows />
      <div style={{ ...useFade(2, 14), marginBottom: 50 }}>
        <Eyebrow delay={2}>How it works</Eyebrow>
      </div>
      <div style={{ display: 'flex', gap: 80 }}>
        <div style={{ ...useFade(10, 18), flex: 1, borderLeft: `3px solid ${BRAND.colors.accent}`, paddingLeft: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.colors.accent, marginBottom: 24 }}>What it does</div>
          {doItems.map((t, i) => (
            <div key={i} style={{ fontSize: 30, fontWeight: 600, color: BRAND.colors.text, marginBottom: 16, letterSpacing: '-0.01em' }}>
              {renderAccented(t)}
            </div>
          ))}
        </div>
        <div style={{ ...useFade(18, 18), flex: 1, borderLeft: `3px solid ${BRAND.colors.borderStrong}`, paddingLeft: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND.colors.textMuted, marginBottom: 24 }}>What it replaces</div>
          {notItems.map((t, i) => (
            <div key={i} style={{ fontSize: 30, fontWeight: 500, color: BRAND.colors.textDim, marginBottom: 16, textDecoration: 'line-through', textDecorationColor: BRAND.colors.accent }}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...useFade(30, 16), display: 'flex', gap: 18, marginTop: 64 }}>
        {tools.map((t, i) => (
          <div key={i} style={{ padding: '14px 26px', background: BRAND.colors.bgCard, border: `1px solid ${BRAND.colors.border}`, borderRadius: 999, fontSize: 22, fontWeight: 600, color: BRAND.colors.text, boxShadow: '0 4px 12px rgba(28,28,28,0.04)' }}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const MasterItem: React.FC<{ n: string; title: string; sub: string; delay: number }> = ({ n, title, sub, delay }) => {
  const f = useFade(delay, 16);
  const bonus = n === '✦';
  return (
    <div style={{ ...f, display: 'flex', alignItems: 'baseline', gap: 26 }}>
      <span style={{ fontSize: bonus ? 26 : 34, fontWeight: 800, color: BRAND.colors.accent, width: 56, letterSpacing: '-0.02em' }}>{n}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: BRAND.colors.text, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ fontSize: 21, fontWeight: 500, color: BRAND.colors.textMuted }}>{sub}</span>
      </div>
    </div>
  );
};

const Master: React.FC = () => {
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
      <Glows />
      <div style={{ ...useFade(2, 14), marginBottom: 36 }}>
        <Eyebrow delay={2}>What the pipeline handles</Eyebrow>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {items.map(([n, title, sub], i) => (
          <MasterItem key={i} n={n} title={title} sub={sub} delay={8 + i * 5} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const TransformCol: React.FC<{ from: string; to: string; label: string; delay: number }> = ({ from, to, label, delay }) => {
  const f = useFade(delay, 20);
  return (
    <div style={{ ...f, flex: 1 }}>
      <div style={{ fontSize: 32, fontWeight: 500, color: 'rgba(242,237,232,0.45)', textDecoration: 'line-through', textDecorationColor: ROSE }}>{from}</div>
      <div style={{ fontSize: 30, color: ROSE, margin: '8px 0 6px' }}>↓</div>
      <div style={{ fontSize: 80, fontWeight: 800, color: ROSE, letterSpacing: '-0.03em', lineHeight: 1 }}>{to}</div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(242,237,232,0.5)', marginTop: 22 }}>{label}</div>
    </div>
  );
};

const Transform: React.FC = () => {
  const cols: [string, string, string][] = [
    ['Manual', 'Automated', 'How it gets made'],
    ['One-off', 'Repeatable', 'How it scales'],
  ];
  return (
    <AbsoluteFill style={{ background: DARK, padding: `0 ${MARGIN}px`, justifyContent: 'center' }}>
      <Glows dark />
      <div style={{ ...useFade(2, 14), marginBottom: 44 }}>
        <Eyebrow delay={2} color={ROSE}>From outline to video</Eyebrow>
      </div>
      <div style={{ display: 'flex', gap: 90, borderTop: `1px solid rgba(242,237,232,0.12)`, paddingTop: 50 }}>
        {cols.map(([from, to, label], i) => (
          <TransformCol key={i} from={from} to={to} label={label} delay={10 + i * 8} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC = () => {
  const line = useFade(18, 0);
  return (
    <AbsoluteFill style={{ background: BRAND.colors.bgBase, alignItems: 'center', justifyContent: 'center' }}>
      <Glows />
      <div style={{ ...useFade(2, 18) }}>
        <Wordmark size={150} />
      </div>
      <div style={{ ...useFade(12, 18), marginTop: 30, fontSize: 56, fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', color: BRAND.colors.text }}>
        {renderAccented('From outline to *finished video.*')}
      </div>
      <div style={{ ...useFade(20, 14), marginTop: 28, fontSize: 22, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRAND.colors.textMuted }}>
        Sample pipeline · Demo build
      </div>
      <div style={{ ...line, marginTop: 26, width: interpolate(line.opacity, [0, 1], [0, 320]), height: 3, background: BRAND.colors.accent, borderRadius: BRAND.radius }} />
    </AbsoluteFill>
  );
};

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
  return (
    <AbsoluteFill style={{ fontFamily, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: MARGIN, top: 56, display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 26, letterSpacing: '-0.02em' }}>
        <span style={{ color: accent, fontWeight: 800 }}>Sample</span>
        <span style={{ color: muted, fontWeight: 400, fontSize: 22 }}>Academy</span>
      </div>
      <div style={{ position: 'absolute', right: MARGIN, top: 62, fontSize: 16, fontWeight: 600, letterSpacing: '0.16em', color: muted }}>{SIZZLE_LABEL}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {MANIFESTO_BEATS.map((_, i) => (
          <div key={i} style={{ width: i === active ? 26 : 7, height: 7, borderRadius: 4, background: i === active ? accent : i < active ? (dark ? 'rgba(231,166,174,0.5)' : 'rgba(139,38,53,0.5)') : (dark ? 'rgba(242,237,232,0.25)' : BRAND.colors.borderStrong) }} />
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
  <AbsoluteFill>
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
      <div style={{ width, height: bandH, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: STAGE_W, height: STAGE_H, position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Stage />
        </div>
      </div>
    </AbsoluteFill>
  );
};
