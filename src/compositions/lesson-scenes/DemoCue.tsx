import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { DemoCueContent } from './content-types';
import { BRAND, LEADING } from '../../brand/tokens';
import { fontFamily, Glide, useGlideIn } from './shared';
import { PulseRing } from './primitives';

const DARK = BRAND.colors.text;
const ON_DARK = BRAND.colors.bgBase;
const ON_DARK_MUTED = 'rgba(237,232,227,0.62)';
const HAIRLINE_DARK = 'rgba(237,232,227,0.16)';

/**
 * `demo-cue` — frames a live on-camera demo. Dark stage, a pulsing "Live demo"
 * flag, the question the demo answers, and a small meta list. Never fabricates
 * the demo output — it only sets up what's about to happen.
 */
export const DemoCue: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as DemoCueContent;
  const title = useGlideIn(16, 24);
  const sub = useGlideIn(28, 18);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK,
        fontFamily,
        color: ON_DARK,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 160px',
        gap: 36,
      }}
    >
      <LiveFlag />
      <div style={{ fontSize: 22, fontWeight: BRAND.font.weights.bold, letterSpacing: '0.14em', lineHeight: LEADING.caps, textTransform: 'uppercase', color: ON_DARK_MUTED }}>
        {c.eyebrow}
      </div>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 92,
          lineHeight: LEADING.display,
          letterSpacing: '-0.02em',
          whiteSpace: 'pre-line',
        }}
      >
        {c.title}
      </h1>
      <p style={{ ...sub, margin: 0, fontSize: 30, lineHeight: 1.45, color: ON_DARK_MUTED, maxWidth: 1200 }}>
        {c.sub}
      </p>

      <div style={{ display: 'flex', gap: 48, marginTop: 16 }}>
        {c.meta.map((m, i) => (
          <Glide key={m.id} delay={48 + i * 10} fromY={18} style={{ flex: 1 }}>
            <div style={{ borderTop: `1px solid ${HAIRLINE_DARK}`, paddingTop: 16 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: BRAND.font.weights.bold,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: BRAND.colors.accent,
                  marginBottom: 8,
                }}
              >
                {m.k}
              </div>
              <div style={{ fontSize: 26, lineHeight: 1.35, color: ON_DARK }}>{m.v}</div>
            </div>
          </Glide>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const LiveFlag: React.FC = () => {
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        borderRadius: 999,
        backgroundColor: BRAND.colors.accent,
        color: ON_DARK,
        fontWeight: BRAND.font.weights.bold,
        fontSize: 20,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {/* PulseRing centered over a solid dot */}
      <span style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PulseRing size={48} color={ON_DARK} rings={2} style={{ position: 'absolute', left: -12, top: -12 }} />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: ON_DARK,
            flexShrink: 0,
          }}
        />
      </span>
      Live demo
    </div>
  );
};
