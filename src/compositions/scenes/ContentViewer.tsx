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

const TOOLS = [
  { name: 'ChatGPT', vendor: 'OpenAI', priority: 'P0', caps: '9/11', desc: 'Versatile AI assistant with GPT-4o, image generation, and browsing capabilities.' },
  { name: 'Claude', vendor: 'Anthropic', priority: 'P0', caps: '8/11', desc: 'Advanced reasoning with 200K context, document analysis, and coding support.' },
  { name: 'Gemini', vendor: 'Google', priority: 'P0', caps: '9/11', desc: 'Multimodal AI with deep Google integration, large context, and code execution.' },
  { name: 'Perplexity', vendor: 'Perplexity AI', priority: 'P0', caps: '6/11', desc: 'Research-focused AI with real-time web search and source citations.' },
];

const FILTER_PILLS = ['All', 'Essential', 'Research', 'Writing & Chat', 'File Analysis', 'Agents'];
const ACTIVE_FILTERS = ['All', 'Essential'];

export const ContentViewer: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springCfg = { damping: 18, mass: 0.5 };

  const navProgress = spring({ frame: local, fps, config: springCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: springCfg });
  const filterProgress = spring({ frame: local - 25, fps, config: springCfg });

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

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    fontSize: 13,
    fontFamily,
    fontWeight: 600,
    borderRadius: BRAND.radius,
    border: `1px solid ${active ? ACCENT : BORDER}`,
    backgroundColor: active ? ACCENT : CARD_BG,
    color: active ? '#FFFFFF' : TEXT,
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
            <div style={tabStyle(false)}>Chat</div>
            <div style={tabStyle(true)}>Content</div>
            <div style={tabStyle(false)}>Compare</div>
          </div>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, fontFamily }}>
            Sample Academy
          </span>
        </nav>

        {/* Content area */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'hidden', backgroundColor: BASE }}>
          {/* Header */}
          <div
            style={{
              opacity: headerProgress,
              transform: `translateY(${interpolate(headerProgress, [0, 1], [15, 0])}px)`,
              marginBottom: 20,
            }}
          >
            <div style={{ fontFamily, fontWeight: 800, fontSize: 26, color: TEXT, marginBottom: 4 }}>
              AI Tools Repository
            </div>
            <div style={{ fontFamily, fontSize: 14, color: MUTED }}>
              4 tools tracked &middot; 32 total capabilities mapped
            </div>
          </div>

          {/* Filter bar */}
          <div
            style={{
              opacity: filterProgress,
              transform: `translateY(${interpolate(filterProgress, [0, 1], [10, 0])}px)`,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            {FILTER_PILLS.map((pill) => (
              <div key={pill} style={pillStyle(ACTIVE_FILTERS.includes(pill))}>
                {pill}
              </div>
            ))}
          </div>

          {/* Tool cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}
          >
            {TOOLS.map((tool, i) => {
              const cardProgress = spring({
                frame: local - 45 - i * 12,
                fps,
                config: { damping: 16, mass: 0.5 },
              });

              return (
                <div
                  key={tool.name}
                  style={{
                    opacity: cardProgress,
                    transform: `translateY(${interpolate(cardProgress, [0, 1], [25, 0])}px)`,
                    backgroundColor: CARD_BG,
                    border: `1px solid ${BORDER}`,
                    borderRadius: BRAND.radius,
                    padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontFamily, fontWeight: 700, fontSize: 17, color: TEXT }}>
                      {tool.name}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: BRAND.radius,
                        backgroundColor: tool.priority === 'P0' ? ACCENT : `${ACCENT}20`,
                        color: tool.priority === 'P0' ? '#FFFFFF' : ACCENT,
                        fontFamily,
                      }}
                    >
                      Essential
                    </span>
                  </div>
                  <div style={{ fontFamily, fontSize: 12, color: MUTED, marginBottom: 8 }}>
                    {tool.vendor}
                  </div>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: TEXT,
                      marginBottom: 10,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {tool.desc}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED, fontFamily, fontWeight: 500 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
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
        </div>
      </div>
    </div>
  );
};
