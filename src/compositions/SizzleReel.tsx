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

// The reel is authored on a 16:9 stage; the 9:16 cut is the same stage fit to width
// (so nothing clips). On-brand portrait re-layout + the captured-footage/music beats
// land with the Playwright-capture increment — the rendered lesson MP4 is git-ignored,
// so it is not a render-time dependency here.
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

/**
 * Fades the incoming scene's whole container in over its first frames. Scenes have
 * opaque backgrounds, so without this an overlapping cut would just hard-swap; fading
 * the container lets the held outgoing scene show through → a smooth crossfade.
 */
const FadeIn: React.FC<{ children: React.ReactNode; frames?: number }> = ({ children, frames = 20 }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, frames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * SizzleReel — stakeholder demo tour, rendered to both 9:16 and 16:9 from one source.
 *
 * Reuses the PlatformWalkthrough scene shells (TitleCard → ChatDemo → ContentViewer →
 * ComparisonView) as the platform-tour beats, then a brand payoff card. The whole
 * 16:9 stage is scaled to the active frame width, so the portrait cut renders without
 * clipping. Render: `remotion render src/index.ts SizzleReel out/sizzle-16x9.mp4`
 * and `--props '{"format":"9:16"}'` for the vertical cut.
 */
export const SizzleReel: React.FC<SizzleReelProps> = () => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = width / STAGE_W; // 1 for 16:9, 0.5625 for the 9:16 fit-to-width cut

  const outroOpacity =
    frame >= 1680
      ? interpolate(frame, [1680, 1800], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: STAGE_W, height: STAGE_H, position: 'relative', overflow: 'hidden', transform: `scale(${scale})`, flexShrink: 0 }}>
        <AbsoluteFill>
          {/* Hook + chatbot + pipeline + comparison — the live-app tour beats.
              Each beat underlaps the next by 60f: the incoming scene springs in over
              the held outgoing one, so cuts crossfade with no bg-only gap (smooth-
              transitions rule). The scenes settle-and-hold, so the overlap is clean. */}
          <Sequence from={0} durationInFrames={300}><TitleCard /></Sequence>
          <Sequence from={240} durationInFrames={540}><FadeIn><ChatDemo /></FadeIn></Sequence>
          <Sequence from={720} durationInFrames={540}><FadeIn><ContentViewer /></FadeIn></Sequence>
          <Sequence from={1200} durationInFrames={540}><FadeIn><ComparisonView /></FadeIn></Sequence>

          {/* Payoff / CTA */}
          <Sequence from={1680} durationInFrames={120}>
            <AbsoluteFill
              style={{
                backgroundColor: BRAND.colors.bgBase,
                opacity: outroOpacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <div style={{ width: 80, height: 4, backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }} />
              <div style={{ fontFamily, fontWeight: BRAND.font.weights.bold, fontSize: 56, color: BRAND.colors.text, textAlign: 'center' }}>
                From prompt to publish-ready.
              </div>
              <div style={{ fontFamily, fontWeight: BRAND.font.weights.regular, fontSize: 28, color: BRAND.colors.accent, textAlign: 'center' }}>
                Sample Academy — AI that builds the course.
              </div>
            </AbsoluteFill>
          </Sequence>
        </AbsoluteFill>
      </div>
    </AbsoluteFill>
  );
};
