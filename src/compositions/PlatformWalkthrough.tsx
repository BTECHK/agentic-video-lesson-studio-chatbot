import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';
import { BRAND } from '../brand/tokens';
import { TitleCard } from './scenes/TitleCard';
import { ChatDemo } from './scenes/ChatDemo';
import { ContentViewer } from './scenes/ContentViewer';
import { ComparisonView } from './scenes/ComparisonView';
import { FeatureHighlights } from './scenes/FeatureHighlights';
import { SceneAmbient } from './lesson-scenes/shared';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

/**
 * PlatformWalkthrough: 78-second (2340 frames at 30fps) composition
 * showing Sample Academy platform features in a screen-recording style.
 * Hard cap: 1:20 (2400 frames).
 *
 * Scene timing (script: walkthrough.script.md):
 *   TitleCard:         0-210    (7s)  brand intro
 *   ChatDemo:          210-870  (22s) Tutor chat + Telegram companion
 *   ContentViewer:     870-1350 (16s) AI tools repository
 *   ComparisonView:    1350-1830 (16s) comparison page
 *   FeatureHighlights: 1830-2190 (12s) freshness + quality gates
 *   Outro:             2190-2340 (5s)  closing fade
 */
const OUTRO_FROM = 2190;
const TOTAL = 2340;

export const PlatformWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();

  // Outro fade: fade to brand base color
  const outroOpacity = frame >= OUTRO_FROM
    ? interpolate(frame, [OUTRO_FROM, TOTAL], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase }}>
      {/* Background music bed — same asset the sizzle ships (public/sizzle/music-bed.m4a),
          boosted (source mean ~-52dB) to land in the -20..-35dB gate:media range. */}
      <Audio src={staticFile('sizzle/music-bed.m4a')} volume={10} />

      {/* Scene 1: Title Card */}
      <Sequence from={0} durationInFrames={210}>
        <TitleCard />
      </Sequence>

      {/* Scene 2: Chat Demo + Telegram companion */}
      <Sequence from={210} durationInFrames={660}>
        <ChatDemo />
      </Sequence>

      {/* Scene 3: Content Viewer */}
      <Sequence from={870} durationInFrames={480}>
        <ContentViewer />
      </Sequence>

      {/* Scene 4: Comparison View */}
      <Sequence from={1350} durationInFrames={480}>
        <ComparisonView />
      </Sequence>

      {/* Scene 5: Feature Highlights — freshness + quality gates */}
      <Sequence from={1830} durationInFrames={360}>
        <FeatureHighlights />
      </Sequence>

      {/* Outro: fade overlay with brand accent mark */}
      <Sequence from={OUTRO_FROM} durationInFrames={TOTAL - OUTRO_FROM}>
        <AbsoluteFill
          style={{
            backgroundColor: BRAND.colors.bgBase,
            opacity: outroOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <SceneAmbient />
          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: BRAND.colors.accent,
              borderRadius: BRAND.radius,
            }}
          />
          <div
            style={{
              fontFamily,
              fontWeight: BRAND.font.weights.bold,
              fontSize: 28,
              color: BRAND.colors.text,
              textAlign: 'center',
            }}
          >
            Sample Academy
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: BRAND.font.weights.regular,
              fontSize: 16,
              color: BRAND.colors.accent,
              textAlign: 'center',
            }}
          >
            Learn More at example.com
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
