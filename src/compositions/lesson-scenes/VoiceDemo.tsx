import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { VoiceDemoContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, GLIDE, SceneFrame, Eyebrow, SceneTitle, SceneSub, useGlideIn } from './shared';

const CARD_BG = '#F7F4EF';
const BAR_COUNT = 28;

/**
 * `voice-demo` — a pulsing mic + live waveform + a transcript that types in,
 * illustrating voice/dictation features.
 */
export const VoiceDemo: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as VoiceDemoContent;
  const card = useGlideIn(45, 30);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Transcript types between ~2.3s and ~4.5s (settled by the ~5s still).
  const shown = Math.round(
    interpolate(frame, [2.3 * fps, 4.5 * fps], [0, c.transcript.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(...GLIDE),
    }),
  );

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      <div
        style={{
          ...card,
          width: '100%',
          marginTop: 24,
          padding: 36,
          backgroundColor: CARD_BG,
          border: `2px solid ${HAIRLINE}`,
          borderRadius: BRAND.radius,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Mic />
          <Waveform />
          <Timer />
        </div>
        <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: 24 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: BRAND.font.weights.bold,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BRAND.colors.accent,
              marginBottom: 12,
            }}
          >
            {c.transcriptLabel}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: BRAND.colors.text, minHeight: 84 }}>
            {c.transcript.slice(0, shown)}
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

const Mic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * 1.4);
  const ring = interpolate(pulse, [0, 1], [0, 0.35]);
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          backgroundColor: BRAND.colors.accent,
          opacity: ring,
          transform: `scale(${interpolate(pulse, [0, 1], [1, 1.4])})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          backgroundColor: BRAND.colors.accent,
          color: BRAND.colors.bgBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        ●
      </div>
    </div>
  );
};

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, height: 72 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const h = 0.2 + 0.8 * Math.abs(Math.sin(t * 3 + i * 0.5));
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h * 100}%`,
              backgroundColor: BRAND.colors.accent,
              opacity: 0.55,
              borderRadius: BRAND.radius,
            }}
          />
        );
      })}
    </div>
  );
};

const Timer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.floor(frame / fps);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return (
    <div
      style={{
        fontSize: 30,
        fontWeight: BRAND.font.weights.bold,
        color: MUTED,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {mm}:{ss}
    </div>
  );
};
