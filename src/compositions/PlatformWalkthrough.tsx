import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';
import { BRAND } from '../brand/tokens';
import { TitleCard } from './scenes/TitleCard';
import { ChatDemo } from './scenes/ChatDemo';
import { ContentViewer } from './scenes/ContentViewer';
import { ComparisonView } from './scenes/ComparisonView';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

/**
 * PlatformWalkthrough: 60-second (1800 frames at 30fps) composition
 * showing Sample Academy platform features in a screen-recording style.
 *
 * Scene timing:
 *   TitleCard:       0-240   (8s)   brand intro
 *   ChatDemo:        240-720 (16s)  chatbot conversation
 *   ContentViewer:   720-1200 (16s) content browsing
 *   ComparisonView:  1200-1680 (16s) comparison page
 *   Outro:           1680-1800 (4s)  closing fade
 */
export const PlatformWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();

  // Outro fade (frames 1680-1800): fade to brand base color
  const outroOpacity = frame >= 1680
    ? interpolate(frame, [1680, 1800], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.colors.bgBase }}>
      {/* Background music bed — same asset the sizzle ships (public/sizzle/music-bed.m4a),
          boosted (source mean ~-52dB) to land in the -20..-35dB gate:media range. */}
      <Audio src={staticFile('sizzle/music-bed.m4a')} volume={10} />

      {/* Scene 1: Title Card */}
      <Sequence from={0} durationInFrames={240}>
        <TitleCard />
      </Sequence>

      {/* Scene 2: Chat Demo */}
      <Sequence from={240} durationInFrames={480}>
        <ChatDemo />
      </Sequence>

      {/* Scene 3: Content Viewer */}
      <Sequence from={720} durationInFrames={480}>
        <ContentViewer />
      </Sequence>

      {/* Scene 4: Comparison View */}
      <Sequence from={1200} durationInFrames={480}>
        <ComparisonView />
      </Sequence>

      {/* Outro: fade overlay with brand accent mark */}
      <Sequence from={1680} durationInFrames={120}>
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
