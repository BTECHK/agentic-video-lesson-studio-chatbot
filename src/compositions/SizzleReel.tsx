import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  type CalculateMetadataFunction,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';
import { BRAND } from '../brand/tokens';
import { TitleCard } from './scenes/TitleCard';
import { ChatDemo } from './scenes/ChatDemo';
import { ContentViewer } from './scenes/ContentViewer';
import { ComparisonView } from './scenes/ComparisonView';

const { fontFamily } = loadFont('normal', { weights: ['400', '600', '800'], subsets: ['latin'] });

export type SizzleFormat = '9:16' | '16:9';
export type SizzleReelProps = { format?: SizzleFormat };

// The tour beats are authored on a 16:9 stage. 16:9 plays the stage full-bleed;
// 9:16 frames that stage as a content band inside brand chrome (eyebrow + kinetic
// caption), so the portrait cut fills the frame on-brand instead of letterboxing.
const STAGE_W = 1920;
const STAGE_H = 1080;
export const SIZZLE_DURATION = 1800; // 60s @ 30fps

/** Output dimensions for the chosen format — one source, two shapes (#74). */
export function sizzleDimensions(format: SizzleFormat): { width: number; height: number } {
  return format === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}

/** Drives Remotion's width/height from the `format` prop (mirrors LessonVideo's pattern). */
export const sizzleReelMetadata: CalculateMetadataFunction<SizzleReelProps> = ({ props }) => {
  const format = props.format ?? '16:9';
  return {
    durationInFrames: SIZZLE_DURATION,
    fps: BRAND.video.fps,
    ...sizzleDimensions(format),
    props: { ...props, format },
  };
};

// Kinetic captions, on their own timeline (the issue's 60s beat script). Each fades
// in/out within its range; shown as a lower-third in 16:9 and the bottom band in 9:16.
const CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0, end: 240, text: 'What if an outline became a finished lesson — automatically?' },
  { start: 240, end: 720, text: 'Ask. Outline. Go.' },
  { start: 720, end: 1200, text: 'Outline → Lesson Plan → Script.' },
  { start: 1200, end: 1680, text: '3 quality gates. Automatically.' },
  { start: 1680, end: 1800, text: 'From prompt to publish-ready.' },
];

const KineticCaption: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const frame = useCurrentFrame();
  const active = CAPTIONS.find((c) => frame >= c.start && frame < c.end);
  if (!active) return null;
  const local = frame - active.start;
  const len = active.end - active.start;
  const opacity = interpolate(local, [0, 14, len - 14, len], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [0, 14], [18, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        fontFamily,
        fontWeight: BRAND.font.weights.bold,
        fontSize: portrait ? 52 : 38,
        lineHeight: 1.2,
        color: BRAND.colors.text,
        textAlign: 'center',
        maxWidth: portrait ? 920 : 1400,
        opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      {active.text}
    </div>
  );
};

/**
 * Fades the incoming scene's container in over its first frames. Scenes have opaque
 * backgrounds, so without this an overlapping cut would hard-swap; fading the
 * container lets the held outgoing scene show through → a smooth crossfade.
 */
const FadeIn: React.FC<{ children: React.ReactNode; frames?: number }> = ({ children, frames = 20 }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, frames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const payoffCard = (
  <AbsoluteFill
    style={{
      backgroundColor: BRAND.colors.bgBase,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}
  >
    <div style={{ width: 80, height: 4, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }} />
    <div style={{ fontFamily, fontWeight: BRAND.font.weights.bold, fontSize: 56, color: BRAND.colors.text, textAlign: 'center' }}>
      Sample Academy
    </div>
    <div style={{ fontFamily, fontWeight: BRAND.font.weights.regular, fontSize: 28, color: BRAND.colors.accent, textAlign: 'center' }}>
      AI that builds the course.
    </div>
  </AbsoluteFill>
);

/** The platform-tour beat stack (live-app shells today; swapped for Playwright capture later). */
const SceneStage: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={300}><TitleCard /></Sequence>
    <Sequence from={240} durationInFrames={540}><FadeIn><ChatDemo /></FadeIn></Sequence>
    <Sequence from={720} durationInFrames={540}><FadeIn><ContentViewer /></FadeIn></Sequence>
    <Sequence from={1200} durationInFrames={540}><FadeIn><ComparisonView /></FadeIn></Sequence>
    <Sequence from={1680} durationInFrames={120}><FadeIn>{payoffCard}</FadeIn></Sequence>
  </AbsoluteFill>
);

/**
 * SizzleReel — stakeholder demo tour, rendered to both 9:16 and 16:9 from one source.
 *
 * 16:9 plays the authored stage full-bleed. 9:16 frames the same stage as a content
 * band between a brand eyebrow and a kinetic caption, so the portrait cut fills the
 * frame on-brand. Render: `remotion render src/index.ts SizzleReel out/sizzle-16x9.mp4`
 * and `--props '{"format":"9:16"}'` for the vertical cut.
 */
export const SizzleReel: React.FC<SizzleReelProps> = () => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const scale = width / STAGE_W;
  const bandH = STAGE_H * scale;

  // The stage scaled to the frame width — full-bleed in 16:9, a 1080×607 band in 9:16.
  const band = (
    <div style={{ width, height: bandH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: STAGE_W, height: STAGE_H, position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SceneStage />
      </div>
    </div>
  );

  if (!portrait) {
    return (
      <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase, justifyContent: 'center', alignItems: 'center' }}>
        {band}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 80, display: 'flex', justifyContent: 'center', padding: '0 96px' }}>
          <KineticCaption portrait={false} />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: 150, paddingBottom: 170 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 4, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }} />
        <div style={{ fontFamily, fontWeight: BRAND.font.weights.bold, fontSize: 34, letterSpacing: 2, color: BRAND.colors.text }}>
          SAMPLE ACADEMY
        </div>
      </div>
      {band}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 80px' }}>
        <KineticCaption portrait />
      </div>
    </AbsoluteFill>
  );
};
