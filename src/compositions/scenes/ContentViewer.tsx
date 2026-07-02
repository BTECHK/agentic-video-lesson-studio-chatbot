import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND, SHADOW } from '../../brand/tokens';
import { fontFamily, MUTED, SceneAmbient } from '../lesson-scenes/shared';

const ACCENT = BRAND.colors.accent;
const TEXT = BRAND.colors.text;
const BASE = BRAND.colors.bgBase;
const CARD = BRAND.colors.bgCard;
const DARK = BRAND.colors.bgDark;
const BORDER = BRAND.colors.border;
const ACCENT_SOFT = BRAND.colors.accentSoft;

const ALL_TOOLS = [
  { name: 'ChatGPT', vendor: 'OpenAI', caps: '11/11', desc: 'Versatile AI assistant with GPT-4o, image generation, and browsing.', hasResearch: true },
  { name: 'Claude', vendor: 'Anthropic', caps: '9/11', desc: 'Advanced reasoning with 200K context, document analysis, and coding.', hasResearch: true },
  { name: 'Gemini', vendor: 'Google', caps: '11/11', desc: 'Multimodal AI with deep Google integration and large context.', hasResearch: true },
  { name: 'Perplexity', vendor: 'Perplexity AI', caps: '6/11', desc: 'Research-focused AI with real-time web search and citations.', hasResearch: true },
  { name: 'Claude Code', vendor: 'Anthropic', caps: '9/11', desc: 'CLI-first agentic coding tool operating directly in the terminal.', hasResearch: false },
  { name: 'Codex', vendor: 'OpenAI', caps: '8/11', desc: 'Cloud-based coding agent running in a sandboxed environment.', hasResearch: false },
];

const CAPABILITIES = [
  { name: 'Writing Chat', count: 5 },
  { name: 'Research', count: 3 },
  { name: 'File Analysis', count: 5 },
  { name: 'Document Creation', count: 4 },
  { name: 'Image Generation', count: 1 },
  { name: 'Prototyping', count: 4 },
  { name: 'Personalization', count: 3 },
  { name: 'Persistent Context', count: 3 },
  { name: 'Agents', count: 4 },
];

const FILTERS = ['All', 'Essential', 'Supplementary', 'Research', 'Writing & Chat', 'File Analysis'];

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

export const ContentViewer: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sCfg = { damping: 18, mass: 0.5 };

  const navProgress = spring({ frame: local, fps, config: sCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: sCfg });
  const filterProgress = spring({ frame: local - 25, fps, config: sCfg });

  // Phase 1 (0-120): Initial grid with all 6 tools
  // Phase 2 (120-200): Click "Research" filter — grid filters to 4 tools
  // Phase 3 (200-320): Click Claude card — expand to detail view
  // Phase 4 (320-480): Show capability accordion expanding

  const researchFilterActive = local >= 130;
  const showDetail = local >= 210;
  const detailTransition = spring({ frame: local - 210, fps, config: { damping: 16, mass: 0.6 } });

  // Cursor simulation
  const cursorX =
    local < 130
      ? interpolate(local, [100, 128], [500, 348], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : local < 210
      ? interpolate(local, [150, 200], [348, 300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(local, [210, 240], [300, -100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cursorY =
    local < 130
      ? interpolate(local, [100, 128], [350, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : local < 210
      ? interpolate(local, [150, 200], [140, 280], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(local, [210, 240], [280, -100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const showCursor = local >= 100 && local < 240;

  const filterClickPulse =
    local >= 125 && local < 140
      ? interpolate(local, [125, 132, 140], [1, 1.08, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1;

  const visibleTools = researchFilterActive && !showDetail
    ? ALL_TOOLS.filter((t) => t.hasResearch)
    : showDetail
    ? []
    : ALL_TOOLS;

  const pillStyle = (name: string): React.CSSProperties => {
    const isActive =
      (name === 'All' && !researchFilterActive) || (name === 'Research' && researchFilterActive);
    return {
      padding: '5px 14px',
      fontSize: 13,
      fontFamily,
      fontWeight: 600,
      borderRadius: BRAND.radius,
      backgroundColor: isActive ? ACCENT : DARK,
      color: isActive ? '#FFFFFF' : TEXT,
      transform: name === 'Research' ? `scale(${filterClickPulse})` : undefined,
    };
  };

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
        position: 'relative',
        fontFamily,
      }}
    >
      <SceneAmbient />
      {/* Floating window */}
      <div
        style={{
          width: 1000,
          borderRadius: BRAND.radiusWindow,
          overflow: 'hidden',
          border: `1px solid ${BORDER}`,
          boxShadow: SHADOW.window,
          opacity: navProgress,
          transform: `translateY(${interpolate(navProgress, [0, 1], [30, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          height: 620,
          backgroundColor: CARD,
        }}
      >
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
            <div style={tabStyle(false)}>Chat</div>
            <div style={tabStyle(true)}>Content</div>
            <div style={tabStyle(false)}>Compare</div>
          </div>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, fontFamily }}>Sample Academy</span>
        </nav>

        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'hidden', backgroundColor: BASE }}>
          {!showDetail ? (
            <>
              <div
                style={{
                  opacity: headerProgress,
                  transform: `translateY(${interpolate(headerProgress, [0, 1], [15, 0])}px)`,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontFamily, fontWeight: 800, fontSize: 26, color: TEXT, marginBottom: 4 }}>
                  AI Tools Repository
                </div>
                <div style={{ fontFamily, fontSize: 14, color: MUTED }}>
                  {researchFilterActive
                    ? '4 tools with Research capability'
                    : '12 tools tracked · 107 total capabilities mapped'}
                </div>
              </div>

              {/* Filter pills */}
              <div
                style={{
                  opacity: filterProgress,
                  transform: `translateY(${interpolate(filterProgress, [0, 1], [10, 0])}px)`,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                {FILTERS.map((f) => (
                  <div key={f} style={pillStyle(f)}>
                    {f}
                  </div>
                ))}
              </div>

              {/* Tool grid — card-white tiles floating on linen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {visibleTools.map((tool, i) => {
                  const cardProgress = spring({
                    frame: local - (researchFilterActive ? 135 : 45) - i * 8,
                    fps,
                    config: { damping: 16, mass: 0.5 },
                  });
                  const isHighlighted = researchFilterActive && tool.name === 'Claude' && local >= 170;
                  const highlightBorder = isHighlighted
                    ? interpolate(spring({ frame: local - 170, fps, config: sCfg }), [0, 1], [0, 1])
                    : 0;
                  const focused = highlightBorder > 0.5;

                  return (
                    <div
                      key={tool.name}
                      style={{
                        opacity: cardProgress,
                        transform: `translateY(${interpolate(cardProgress, [0, 1], [25, 0])}px)`,
                        backgroundColor: CARD,
                        border: `1px solid ${focused ? ACCENT : BORDER}`,
                        borderRadius: BRAND.radiusWindow,
                        padding: '14px 16px',
                        boxShadow: focused ? SHADOW.cardHover : SHADOW.card,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ fontFamily, fontWeight: 700, fontSize: 15, color: TEXT }}>
                          {tool.name}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: BRAND.radius,
                            backgroundColor: ACCENT,
                            color: '#FFF',
                            fontFamily,
                          }}
                        >
                          Essential
                        </span>
                      </div>
                      <div style={{ fontFamily, fontSize: 11, color: MUTED, marginBottom: 6 }}>
                        {tool.vendor}
                      </div>
                      <div
                        style={{
                          fontFamily,
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: TEXT,
                          marginBottom: 8,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {tool.desc}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          color: MUTED,
                          fontFamily,
                          fontWeight: 500,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: ACCENT,
                          }}
                        />
                        {tool.caps} capabilities
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Detail view for Claude */
            <div
              style={{
                opacity: detailTransition,
                transform: `translateY(${interpolate(detailTransition, [0, 1], [20, 0])}px)`,
              }}
            >
              <div
                style={{ fontFamily, fontSize: 13, color: ACCENT, fontWeight: 600, marginBottom: 12 }}
              >
                ← Back to all tools
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}
              >
                <div style={{ fontFamily, fontWeight: 800, fontSize: 32, color: TEXT }}>Claude</div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: BRAND.radius,
                    backgroundColor: ACCENT,
                    color: '#FFF',
                    fontFamily,
                  }}
                >
                  Essential
                </span>
              </div>
              <div style={{ fontFamily, fontSize: 14, color: ACCENT, marginBottom: 4 }}>
                Anthropic · https://claude.ai
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: TEXT,
                  marginBottom: 20,
                  maxWidth: 700,
                }}
              >
                Anthropic's AI assistant known for strong reasoning, long-context understanding, and
                safety-focused design.
              </div>

              <div
                style={{ fontFamily, fontWeight: 700, fontSize: 18, color: TEXT, marginBottom: 12 }}
              >
                Capabilities (9/11)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {CAPABILITIES.map((cap, i) => {
                  const capProgress = spring({
                    frame: local - 240 - i * 5,
                    fps,
                    config: { damping: 14, mass: 0.4 },
                  });
                  return (
                    <div
                      key={cap.name}
                      style={{
                        opacity: capProgress,
                        transform: `scale(${interpolate(capProgress, [0, 1], [0.8, 1])})`,
                        padding: '6px 14px',
                        borderRadius: BRAND.radius,
                        backgroundColor: ACCENT_SOFT,
                        fontFamily,
                        fontSize: 13,
                        fontWeight: 600,
                        color: ACCENT,
                      }}
                    >
                      ✓ {cap.name}
                    </div>
                  );
                })}
              </div>

              {/* Accordion */}
              <div
                style={{ fontFamily, fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 10 }}
              >
                Capability Details
              </div>
              {['Writing Chat', 'Research', 'File Analysis'].map((name, i) => {
                const isOpen = i === 0 && local >= 350;
                const openProgress = spring({
                  frame: local - 350,
                  fps,
                  config: { damping: 18, mass: 0.6 },
                });
                const rowProgress = spring({
                  frame: local - 320 - i * 10,
                  fps,
                  config: sCfg,
                });
                const cap = CAPABILITIES.find((c) => c.name === name)!;

                return (
                  <div
                    key={name}
                    style={{
                      opacity: rowProgress,
                      marginBottom: 6,
                      backgroundColor: CARD,
                      border: `1px solid ${isOpen ? ACCENT : BORDER}`,
                      borderRadius: BRAND.radiusWindow,
                      boxShadow: isOpen ? SHADOW.cardHover : SHADOW.card,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: ACCENT,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontFamily, fontWeight: 700, fontSize: 14, color: TEXT }}>
                          {name}
                        </span>
                      </div>
                      <span style={{ fontFamily, fontSize: 12, color: MUTED }}>
                        {cap.count} features {isOpen ? '▾' : '▸'}
                      </span>
                    </div>
                    {isOpen && (
                      <div
                        style={{
                          padding: '0 16px 12px 32px',
                          maxHeight: interpolate(openProgress, [0, 1], [0, 80]),
                          opacity: openProgress,
                        }}
                      >
                        {['Drafting & editing', 'Brainstorming', 'Summarization', 'Q&A', 'Rewriting']
                          .slice(0, cap.count)
                          .map((f) => (
                            <div key={f} style={{ fontFamily, fontSize: 12, color: MUTED, padding: '2px 0' }}>
                              • {f}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Animated cursor */}
      {showCursor && (
        <div
          style={{
            position: 'absolute',
            left: 460 + cursorX,
            top: 200 + cursorY,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: ACCENT,
            opacity: 0.7,
            boxShadow: `0 0 12px ${ACCENT}60`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
