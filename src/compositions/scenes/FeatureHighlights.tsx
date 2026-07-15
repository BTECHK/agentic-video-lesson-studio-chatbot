import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND, SHADOW } from '../../brand/tokens';
import { fontFamily, MUTED, SceneAmbient } from '../lesson-scenes/shared';

const TEXT = BRAND.colors.text;
const BASE = BRAND.colors.bgBase;
const CARD = BRAND.colors.bgCard;
const BORDER = BRAND.colors.border;
const GREEN = '#3E7C4F';

const VENDORS = ['Claude', 'ChatGPT', 'Gemini', 'Perplexity'];
const GATES = ['A', 'B', 'C', 'L', 'T'];

/**
 * FeatureHighlights: the "under the hood" beat of the platform walkthrough —
 * two quick stakeholder-facing proof points the chat/content/compare scenes
 * don't show: (1) tool facts re-verified against official vendor docs
 * (freshness), (2) five automated quality gates on every lesson.
 */
export const FeatureHighlights: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sCfg = { damping: 18, mass: 0.5 };

  const headerP = spring({ frame: local - 5, fps, config: sCfg });
  const card1P = spring({ frame: local - 25, fps, config: sCfg });
  const card2P = spring({ frame: local - 45, fps, config: sCfg });

  const cardStyle = (p: number): React.CSSProperties => ({
    flex: 1,
    backgroundColor: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: BRAND.radiusWindow,
    boxShadow: SHADOW.window,
    padding: '28px 32px',
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: BASE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 120px',
        gap: 36,
        position: 'relative',
        fontFamily,
      }}
    >
      <SceneAmbient />
      <div
        style={{
          opacity: headerP,
          transform: `translateY(${interpolate(headerP, [0, 1], [20, 0])}px)`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily, fontWeight: 800, fontSize: 44, color: TEXT, letterSpacing: '-0.02em' }}>
          Under the hood
        </div>
        <div style={{ fontFamily, fontSize: 19, color: MUTED, marginTop: 8 }}>
          The platform keeps itself accurate — so the course never goes stale
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, width: '100%', maxWidth: 1400 }}>
        {/* Card 1 — freshness: facts re-verified against vendor docs */}
        <div style={cardStyle(card1P)}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 24, color: TEXT, marginBottom: 4 }}>
            Always current
          </div>
          <div style={{ fontFamily, fontSize: 14, color: MUTED, marginBottom: 20 }}>
            Tool facts re-verified against official vendor docs
          </div>
          {VENDORS.map((v, i) => {
            const rowP = spring({ frame: local - 60 - i * 12, fps, config: sCfg });
            // Dots breathe continuously — motion through the hold.
            const pulse = 0.55 + 0.45 * (Math.sin((local / 30) * 2.4 + i * 1.3) * 0.5 + 0.5);
            return (
              <div
                key={v}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginBottom: 8,
                  backgroundColor: BASE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: BRAND.radius,
                  opacity: rowP,
                  transform: `translateX(${interpolate(rowP, [0, 1], [-24, 0])}px)`,
                }}
              >
                <span style={{ fontFamily, fontWeight: 600, fontSize: 16, color: TEXT }}>{v}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily, fontSize: 12, color: MUTED }}>verified</span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: GREEN,
                      opacity: pulse,
                      boxShadow: `0 0 ${8 * pulse}px ${GREEN}80`,
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>

        {/* Card 2 — quality gates: A·B·C·L·T go green before anything ships */}
        <div style={cardStyle(card2P)}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 24, color: TEXT, marginBottom: 4 }}>
            Quality-gated
          </div>
          <div style={{ fontFamily, fontSize: 14, color: MUTED, marginBottom: 20 }}>
            Five automated gates before any lesson ships
          </div>
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: BASE,
              border: `1px solid ${BORDER}`,
              borderRadius: BRAND.radius,
              marginBottom: 16,
            }}
          >
            <div style={{ fontFamily, fontWeight: 600, fontSize: 15, color: TEXT, marginBottom: 10 }}>
              Lesson 1.2 — Picking the Right Assistant
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {GATES.map((g, i) => {
                const gateP = spring({ frame: local - 90 - i * 14, fps, config: { damping: 14, mass: 0.4 } });
                const green = gateP > 0.5;
                return (
                  <div
                    key={g}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: BRAND.radius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily,
                      fontWeight: 800,
                      fontSize: 19,
                      backgroundColor: green ? GREEN : BORDER,
                      color: green ? '#FFFFFF' : MUTED,
                      transform: `scale(${interpolate(gateP, [0, 1], [0.7, 1])})`,
                      opacity: Math.max(0.4, gateP),
                    }}
                  >
                    {g}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ fontFamily, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            Accuracy · Teaching · Watchability · Layout · Timing — checked on every
            lesson, automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
