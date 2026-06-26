import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { VoiceDemoContent } from './content-types';
import { BRAND, SHADOW } from '../../brand/tokens';
import { MUTED, SceneFrame, Eyebrow, SceneTitle, SceneSub, SimDisclaimer, useGlideIn } from './shared';
import { TypeOn, PulseRing } from './primitives';

const BAR_COUNT = 28;

/**
 * `voice-demo` (v2) — a voice card (`bgCard`, radiusWindow, SHADOW.window)
 * with a pulsing mic using `PulseRing`, an animated waveform (bars driven by
 * frame), a mono timer (BRAND.font.mono), and the transcript typing in via
 * `TypeOn`. All motion settles within the first ~7s then holds.
 */
export const VoiceDemo: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as VoiceDemoContent;
  const card = useGlideIn(45, 30);

  // Transcript types between ~2.3s and ~4.5s (settled by the ~5s still).
  const { fps } = useVideoConfig();
  const transcriptStart = Math.round(2.3 * fps);
  const transcriptDur = Math.round(2.2 * fps);

  return (
    <SceneFrame align="flex-start">
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <SceneTitle delay={14} size={72}>
        {c.title}
      </SceneTitle>
      <SceneSub delay={26}>{c.sub}</SceneSub>

      {/* Voice card — floating window depth */}
      <div
        style={{
          ...card,
          width: '100%',
          marginTop: 24,
          padding: 36,
          backgroundColor: BRAND.colors.bgCard,
          border: `1px solid ${BRAND.colors.border}`,
          borderRadius: BRAND.radiusWindow,
          boxShadow: SHADOW.window,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Mic + waveform + timer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <MicButton />
          <Waveform />
          <Timer />
          <SimDisclaimer style={{ alignSelf: 'flex-start', flexShrink: 0 }} />
        </div>

        {/* Transcript section */}
        <div style={{ borderTop: `1px solid ${BRAND.colors.border}`, paddingTop: 24 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: BRAND.font.weights.bold,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: BRAND.colors.accent,
              marginBottom: 12,
            }}
          >
            {c.transcriptLabel}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: BRAND.colors.text, minHeight: 84 }}>
            <TypeOn
              text={c.transcript}
              startFrame={transcriptStart}
              durFrames={transcriptDur}
              caret={false}
            />
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};

/** Mic circle with three PulseRings expanding outward — the "listening" state. */
const MicButton: React.FC = () => (
  <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
    {/* PulseRing uses frame-driven animation, positioned absolutely to fill the container */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PulseRing size={80} color={BRAND.colors.accent} rings={3} />
    </div>
    {/* Mic icon centered on top */}
    <div
      style={{
        position: 'absolute',
        inset: 18,
        background: BRAND.colors.accent,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: SHADOW.button,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="6" height="12" rx="3" fill={BRAND.colors.bgCard} />
        <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" stroke={BRAND.colors.bgCard} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/** Animated bar waveform — bar heights driven by frame + index phase. */
const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, height: 72 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const h = 0.15 + 0.85 * Math.abs(Math.sin(t * 3 + i * 0.5));
        const isActive = i < Math.floor(BAR_COUNT * 0.5);
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h * 100}%`,
              backgroundColor: isActive ? BRAND.colors.accent : BRAND.colors.borderStrong,
              opacity: isActive ? 0.7 : 0.45,
              borderRadius: BRAND.radius,
            }}
          />
        );
      })}
    </div>
  );
};

/** Mono recording timer — counts up from frame 0. */
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
        fontFamily: BRAND.font.mono,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {mm}:{ss}
    </div>
  );
};
