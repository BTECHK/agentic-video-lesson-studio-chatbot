import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Syne';
import { BRAND } from '../../brand/tokens';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

const ACCENT = BRAND.colors.accent;
const TEXT = BRAND.colors.text;
const BASE = BRAND.colors.bgBase;
const CARD_BG = '#FFFFFF';
const BORDER = 'rgba(28, 28, 28, 0.12)';
const MUTED = 'rgba(28, 28, 28, 0.5)';

export const ChatDemo: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springCfg = { damping: 18, mass: 0.5 };

  // Staggered entrances
  const navProgress = spring({ frame: local, fps, config: springCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: springCfg });
  const userMsgProgress = spring({ frame: local - 40, fps, config: springCfg });
  const typingProgress = spring({ frame: local - 80, fps, config: { damping: 15, mass: 0.4 } });
  const tutorMsgProgress = spring({ frame: local - 120, fps, config: springCfg });
  const citationProgress = spring({ frame: local - 160, fps, config: springCfg });

  // Typing indicator visibility (show between frames 80-120, then hide)
  const showTyping = local >= 80 && local < 120;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0 18px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    fontFamily,
    fontSize: 16,
    fontWeight: 600,
    color: active ? ACCENT : TEXT,
    borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent',
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
        padding: '40px 60px',
      }}
    >
      {/* Browser chrome mockup */}
      <div
        style={{
          width: 1000,
          borderRadius: BRAND.radius,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 8px 40px rgba(28, 28, 28, 0.1)',
          opacity: navProgress,
          transform: `translateY(${interpolate(navProgress, [0, 1], [30, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          height: 620,
          backgroundColor: CARD_BG,
        }}
      >
        {/* TopNav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            padding: '0 16px',
            backgroundColor: CARD_BG,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: 'flex', height: '100%', gap: 8 }}>
            <div style={tabStyle(true)}>Chat</div>
            <div style={tabStyle(false)}>Content</div>
            <div style={tabStyle(false)}>Compare</div>
          </div>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, fontFamily }}>
            Sample Academy
          </span>
        </nav>

        {/* Chat header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${BORDER}`,
            backgroundColor: CARD_BG,
            opacity: headerProgress,
          }}
        >
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: TEXT }}>Tutor</div>
          <div style={{ fontFamily, fontSize: 13, color: MUTED }}>
            Sample Academy AI Teaching Assistant
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            backgroundColor: BASE,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          {/* User message */}
          <div
            style={{
              alignSelf: 'flex-end',
              opacity: userMsgProgress,
              transform: `translateX(${interpolate(userMsgProgress, [0, 1], [40, 0])}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, color: MUTED, fontFamily, fontWeight: 600 }}>You</span>
            <div
              style={{
                backgroundColor: ACCENT,
                color: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: BRAND.radius,
                fontFamily,
                fontSize: 15,
                lineHeight: 1.5,
                maxWidth: 500,
              }}
            >
              What can Claude do for research?
            </div>
          </div>

          {/* Typing indicator */}
          {showTyping && (
            <div
              style={{
                alignSelf: 'flex-start',
                opacity: typingProgress,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, color: MUTED, fontFamily, fontWeight: 600 }}>Tutor</span>
              <div
                style={{
                  backgroundColor: CARD_BG,
                  padding: '12px 16px',
                  borderRadius: BRAND.radius,
                  fontFamily,
                  fontSize: 15,
                  color: MUTED,
                }}
              >
                Thinking...
              </div>
            </div>
          )}

          {/* Tutor response */}
          {local >= 120 && (
            <div
              style={{
                alignSelf: 'flex-start',
                opacity: tutorMsgProgress,
                transform: `translateX(${interpolate(tutorMsgProgress, [0, 1], [-40, 0])}px)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                maxWidth: 600,
              }}
            >
              <span style={{ fontSize: 12, color: MUTED, fontFamily, fontWeight: 600 }}>Tutor</span>
              <div
                style={{
                  backgroundColor: CARD_BG,
                  padding: '12px 16px',
                  borderRadius: BRAND.radius,
                  fontFamily,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: TEXT,
                }}
              >
                Based on our course content, Claude excels at research with its 200K context window
                — you can upload entire papers and get structured summaries. It handles multi-step
                analysis particularly well, breaking complex research questions into logical steps.
              </div>

              {/* Citation badge */}
              <div
                style={{
                  opacity: citationProgress,
                  transform: `translateY(${interpolate(citationProgress, [0, 1], [8, 0])}px)`,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    fontSize: 11,
                    fontFamily,
                    fontWeight: 600,
                    backgroundColor: `${ACCENT}15`,
                    color: ACCENT,
                    borderRadius: BRAND.radius,
                    border: `1px solid ${ACCENT}30`,
                  }}
                >
                  Source: Module 1, Tool: Claude
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: `1px solid ${BORDER}`,
            backgroundColor: CARD_BG,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 14,
              fontFamily,
              color: MUTED,
              backgroundColor: BASE,
              borderRadius: BRAND.radius,
              border: `1px solid ${BORDER}`,
            }}
          >
            Ask Tutor a question...
          </div>
          <div
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontFamily,
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: ACCENT,
              borderRadius: BRAND.radius,
            }}
          >
            Send
          </div>
        </div>
      </div>
    </div>
  );
};
