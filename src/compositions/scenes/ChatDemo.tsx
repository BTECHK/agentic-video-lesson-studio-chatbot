import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND, SHADOW } from '../../brand/tokens';
import { fontFamily, MUTED, SceneAmbient } from '../lesson-scenes/shared';
import { Pinwheel, TypeOn } from '../lesson-scenes/primitives';

const ACCENT = BRAND.colors.accent;
const TEXT = BRAND.colors.text;
const BASE = BRAND.colors.bgBase;
const CARD = BRAND.colors.bgCard;
const DARK = BRAND.colors.bgDark;
const BORDER = BRAND.colors.border;
const ACCENT_SOFT = BRAND.colors.accentSoft;

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

// Telegram companion phase (frames local to the scene): the Telegram panel
// slides in beside the platform chat, they share the frame, then it slides
// back out before the walkthrough cuts to Content.
const TG_IN = 400;
const TG_OUT = 620;
// Telegram brand blue — a faithful third-party depiction, like the vendor
// colors on the sizzle tool chips.
const TG_BLUE = '#2AABEE';

/** Stylized Telegram DM with Tutor — faithful to the real bot: /start greeting,
 *  free-text Q&A, and a `Sources:` footer. No menus or push notifications
 *  (the bot has none). */
const TelegramPanel: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const sCfg = { damping: 18, mass: 0.5 };
  const m1 = spring({ frame: local - (TG_IN + 30), fps, config: sCfg });
  const m2 = spring({ frame: local - (TG_IN + 70), fps, config: sCfg });
  const showTyping = local >= TG_IN + 100 && local < TG_IN + 145;
  const m3 = spring({ frame: local - (TG_IN + 145), fps, config: sCfg });
  const srcP = spring({ frame: local - (TG_IN + 175), fps, config: sCfg });

  const inBubble: React.CSSProperties = {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '10px 14px',
    fontFamily,
    fontSize: 14,
    lineHeight: 1.5,
    color: TEXT,
    maxWidth: 340,
    boxShadow: SHADOW.card,
  };

  return (
    <div
      style={{
        width: 460,
        height: 620,
        borderRadius: BRAND.radiusWindow,
        overflow: 'hidden',
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW.window,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F1EC',
      }}
    >
      {/* Telegram header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: TG_BLUE }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: ACCENT,
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily,
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          T
        </div>
        <div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 16, color: '#FFF' }}>Tutor</div>
          <div style={{ fontFamily, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>bot</div>
        </div>
        <span style={{ marginLeft: 'auto', fontFamily, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
          Telegram
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...inBubble, opacity: m1, transform: `translateY(${interpolate(m1, [0, 1], [14, 0])}px)` }}>
          Hi, I'm Tutor — your Sample Academy assistant. Ask me anything about the AI tools we teach.
        </div>
        {local >= TG_IN + 70 && (
          <div
            style={{
              alignSelf: 'flex-end',
              backgroundColor: '#E3F5D3',
              borderRadius: 12,
              padding: '10px 14px',
              fontFamily,
              fontSize: 14,
              lineHeight: 1.5,
              color: TEXT,
              maxWidth: 320,
              opacity: m2,
              transform: `translateX(${interpolate(m2, [0, 1], [24, 0])}px)`,
              boxShadow: SHADOW.card,
            }}
          >
            What's new with Gemini this week?
          </div>
        )}
        {showTyping && (
          <div style={{ ...inBubble, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pinwheel size={22} />
            <span style={{ color: MUTED, fontSize: 13 }}>typing…</span>
          </div>
        )}
        {local >= TG_IN + 145 && (
          <div style={{ ...inBubble, opacity: m3, transform: `translateY(${interpolate(m3, [0, 1], [14, 0])}px)` }}>
            Gemini 2.5 Pro now offers a 1M-token context window and deep Google integration — the largest context of the tools we track.
            <div style={{ opacity: srcP, marginTop: 6, fontSize: 11, fontWeight: 600, color: MUTED }}>Sources: Gemini</div>
          </div>
        )}
      </div>

      {/* Telegram composer */}
      <div style={{ padding: '10px 14px', backgroundColor: '#FFFFFF', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily, fontSize: 13, color: MUTED }}>Message</div>
      </div>
    </div>
  );
};

export const ChatDemo: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sCfg = { damping: 18, mass: 0.5 };

  // Split-frame choreography: platform chat slides left as Telegram slides in
  // from the right; both reverse before the scene ends.
  const tgInP = spring({ frame: local - TG_IN, fps, config: { damping: 20, mass: 0.7 } });
  const tgOutP = local >= TG_OUT ? spring({ frame: local - TG_OUT, fps, config: { damping: 20, mass: 0.7 } }) : 0;
  const tgNet = Math.max(0, tgInP - tgOutP);
  const mainX = -260 * tgNet;
  const captionP = Math.max(0, spring({ frame: local - (TG_IN + 40), fps, config: sCfg }) - tgOutP);

  const navProgress = spring({ frame: local, fps, config: sCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: sCfg });

  // Conversation 1
  const q1Progress = spring({ frame: local - 30, fps, config: sCfg });
  const showTyping1 = local >= 60 && local < 100;
  const typing1Progress = spring({ frame: local - 60, fps, config: { damping: 15, mass: 0.4 } });
  const a1Progress = spring({ frame: local - 100, fps, config: sCfg });
  const cite1Progress = spring({ frame: local - 130, fps, config: sCfg });

  // Conversation 2
  const q2Progress = spring({ frame: local - 220, fps, config: sCfg });
  const showTyping2 = local >= 250 && local < 300;
  const typing2Progress = spring({ frame: local - 250, fps, config: { damping: 15, mass: 0.4 } });
  const a2Progress = spring({ frame: local - 300, fps, config: sCfg });
  const cite2Progress = spring({ frame: local - 340, fps, config: sCfg });

  // Scroll offset — conversation scrolls up as new messages arrive
  const scrollOffset =
    local >= 220
      ? interpolate(
          spring({ frame: local - 220, fps, config: { damping: 20, mass: 0.8 } }),
          [0, 1],
          [0, -160],
        )
      : 0;

  const a1Text =
    'Claude excels at research with its 200K context window — you can upload entire papers and get structured summaries. It handles multi-step analysis particularly well.';
  const a2Text =
    'Perplexity is better for real-time web research with built-in citations. Claude is stronger for deep analysis of documents you already have. They complement each other well.';
  const composerText = 'How does that compare to Perplexity for research?';

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
        padding: '40px 60px',
        fontFamily,
        position: 'relative',
      }}
    >
      <SceneAmbient />
      {/* Floating window — slides left when the Telegram companion shares the frame */}
      <div
        style={{
          width: 1000,
          borderRadius: BRAND.radiusWindow,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          boxShadow: SHADOW.window,
          opacity: navProgress,
          transform: `translateX(${mainX}px) translateY(${interpolate(navProgress, [0, 1], [30, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          height: 620,
          backgroundColor: CARD,
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
            backgroundColor: CARD,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div style={{ display: 'flex', height: '100%', gap: 8 }}>
            <div style={tabStyle(true)}>Chat</div>
            <div style={tabStyle(false)}>Content</div>
            <div style={tabStyle(false)}>Compare</div>
          </div>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, fontFamily }}>Sample Academy</span>
        </nav>

        {/* Chat header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${BORDER}`,
            backgroundColor: CARD,
            opacity: headerProgress,
          }}
        >
          <div style={{ fontFamily, fontWeight: 700, fontSize: 20, color: TEXT }}>Tutor</div>
          <div style={{ fontFamily, fontSize: 13, color: MUTED }}>Sample Academy AI Teaching Assistant</div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            backgroundColor: BASE,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              transform: `translateY(${scrollOffset}px)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Q1: User */}
            <div
              style={{
                alignSelf: 'flex-end',
                opacity: q1Progress,
                transform: `translateX(${interpolate(q1Progress, [0, 1], [40, 0])}px)`,
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
                  borderRadius: BRAND.radiusWindow,
                  fontFamily,
                  fontSize: 15,
                  lineHeight: 1.5,
                  maxWidth: 500,
                }}
              >
                What can Claude do for research?
              </div>
            </div>

            {/* Thinking beat 1 — Pinwheel */}
            {showTyping1 && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  opacity: typing1Progress,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 12, color: MUTED, fontFamily, fontWeight: 600 }}>Tutor</span>
                <div
                  style={{
                    backgroundColor: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: BRAND.radiusWindow,
                    padding: '14px 18px',
                    boxShadow: SHADOW.card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Pinwheel size={28} />
                  <span style={{ fontFamily, fontSize: 14, color: MUTED }}>Thinking…</span>
                </div>
              </div>
            )}

            {/* A1: Tutor */}
            {local >= 100 && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  opacity: a1Progress,
                  transform: `translateX(${interpolate(a1Progress, [0, 1], [-40, 0])}px)`,
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
                    backgroundColor: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: BRAND.radiusWindow,
                    padding: '14px 18px',
                    fontFamily,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: TEXT,
                    boxShadow: SHADOW.card,
                  }}
                >
                  <TypeOn text={a1Text} startFrame={100} durFrames={60} caret={false} />
                </div>
                <div
                  style={{
                    opacity: cite1Progress,
                    transform: `translateY(${interpolate(cite1Progress, [0, 1], [8, 0])}px)`,
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      fontSize: 11,
                      fontFamily,
                      fontWeight: 600,
                      backgroundColor: ACCENT_SOFT,
                      color: ACCENT,
                      borderRadius: BRAND.radius,
                    }}
                  >
                    Source: Content Repository — Claude
                  </span>
                </div>
              </div>
            )}

            {/* Q2: User follow-up */}
            {local >= 220 && (
              <div
                style={{
                  alignSelf: 'flex-end',
                  opacity: q2Progress,
                  transform: `translateX(${interpolate(q2Progress, [0, 1], [40, 0])}px)`,
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
                    borderRadius: BRAND.radiusWindow,
                    fontFamily,
                    fontSize: 15,
                    lineHeight: 1.5,
                    maxWidth: 500,
                  }}
                >
                  How does that compare to Perplexity for research?
                </div>
              </div>
            )}

            {/* Thinking beat 2 — Pinwheel */}
            {showTyping2 && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  opacity: typing2Progress,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 12, color: MUTED, fontFamily, fontWeight: 600 }}>Tutor</span>
                <div
                  style={{
                    backgroundColor: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: BRAND.radiusWindow,
                    padding: '14px 18px',
                    boxShadow: SHADOW.card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Pinwheel size={28} />
                  <span style={{ fontFamily, fontSize: 14, color: MUTED }}>Thinking…</span>
                </div>
              </div>
            )}

            {/* A2: Tutor comparison answer */}
            {local >= 300 && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  opacity: a2Progress,
                  transform: `translateX(${interpolate(a2Progress, [0, 1], [-40, 0])}px)`,
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
                    backgroundColor: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: BRAND.radiusWindow,
                    padding: '14px 18px',
                    fontFamily,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: TEXT,
                    boxShadow: SHADOW.card,
                  }}
                >
                  <TypeOn text={a2Text} startFrame={300} durFrames={60} caret={false} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    opacity: cite2Progress,
                    transform: `translateY(${interpolate(cite2Progress, [0, 1], [8, 0])}px)`,
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      fontSize: 11,
                      fontFamily,
                      fontWeight: 600,
                      backgroundColor: ACCENT_SOFT,
                      color: ACCENT,
                      borderRadius: BRAND.radius,
                    }}
                  >
                    Source: Claude
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      fontSize: 11,
                      fontFamily,
                      fontWeight: 600,
                      backgroundColor: ACCENT_SOFT,
                      color: ACCENT,
                      borderRadius: BRAND.radius,
                    }}
                  >
                    Source: Perplexity
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer bar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: `1px solid ${BORDER}`,
            backgroundColor: CARD,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 14,
              fontFamily,
              color: MUTED,
              backgroundColor: DARK,
              borderRadius: BRAND.radiusWindow,
            }}
          >
            {local >= 190 && local < 220 ? (
              (() => {
                const chars = Math.floor(
                  interpolate(local, [190, 218], [0, composerText.length], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                );
                return (
                  <span style={{ color: TEXT }}>
                    {composerText.slice(0, chars)}
                    <span style={{ opacity: local % 15 < 8 ? 1 : 0 }}>|</span>
                  </span>
                );
              })()
            ) : (
              <span style={{ color: MUTED }}>Ask Tutor a question…</span>
            )}
          </div>
          <div
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontFamily,
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: ACCENT,
              borderRadius: BRAND.radiusWindow,
            }}
          >
            Send
          </div>
        </div>
      </div>

      {/* Telegram companion — slides in from the right to share the frame */}
      {local >= TG_IN && tgNet > 0.005 && (
        <div
          style={{
            position: 'absolute',
            left: 1260,
            top: (1080 - 620) / 2,
            transform: `translateX(${interpolate(tgNet, [0, 1], [700, 0])}px)`,
            opacity: tgNet,
          }}
        >
          <TelegramPanel local={local} />
        </div>
      )}

      {/* Caption — the "multiple options" line while both panels share the frame */}
      {local >= TG_IN + 40 && captionP > 0.005 && (
        <div
          style={{
            position: 'absolute',
            bottom: 88,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: captionP,
            transform: `translateY(${interpolate(captionP, [0, 1], [14, 0])}px)`,
          }}
        >
          <div
            style={{
              padding: '10px 22px',
              backgroundColor: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: BRAND.radius,
              boxShadow: SHADOW.card,
              fontFamily,
              fontSize: 17,
              fontWeight: 600,
              color: TEXT,
            }}
          >
            One assistant, everywhere — <span style={{ color: ACCENT }}>platform or Telegram</span>, for instructors and students alike
          </div>
        </div>
      )}
    </div>
  );
};
