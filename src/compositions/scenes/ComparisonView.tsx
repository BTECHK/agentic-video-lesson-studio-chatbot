import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BRAND, SHADOW } from '../../brand/tokens';
import { fontFamily, MUTED } from '../lesson-scenes/shared';

const ACCENT = BRAND.colors.accent;
const TEXT = BRAND.colors.text;
const BASE = BRAND.colors.bgBase;
const CARD = BRAND.colors.bgCard;
const DARK = BRAND.colors.bgDark;
const BORDER = BRAND.colors.border;
const ACCENT_SOFT = BRAND.colors.accentSoft;

const ALL_CHIPS = [
  { name: 'ChatGPT' },
  { name: 'Claude' },
  { name: 'Gemini' },
  { name: 'Perplexity' },
  { name: 'DeepSeek' },
  { name: 'Grok' },
];

const METRICS = [
  { metric: 'Primary Model', chatgpt: 'GPT-4o', claude: 'Sonnet 4', gemini: 'Gemini 2.5 Pro', perplexity: 'Sonar Pro' },
  { metric: 'Arena ELO', chatgpt: '1,290', claude: '1,285', gemini: '1,280', perplexity: '1,210' },
  { metric: 'Quality Index', chatgpt: '82/100', claude: '85/100', gemini: '80/100', perplexity: '78/100' },
  { metric: 'Speed (tok/s)', chatgpt: '90', claude: '78', gemini: '120', perplexity: '95' },
  { metric: 'Price (per 1M)', chatgpt: '$10', claude: '$15', gemini: '$7', perplexity: '$5' },
  { metric: 'Context Window', chatgpt: '128K', claude: '200K', gemini: '1M', perplexity: '128K' },
];

const EDITORIAL = [
  { category: 'Best for Research', winner: 'Claude', reason: 'Largest context for deep analysis' },
  { category: 'Best for Speed', winner: 'Gemini', reason: 'Fastest token generation at lowest cost' },
  { category: 'Best for Writing', winner: 'ChatGPT', reason: 'Most versatile creative output' },
];

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

export const ComparisonView: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sCfg = { damping: 18, mass: 0.5 };

  const navProgress = spring({ frame: local, fps, config: sCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: sCfg });
  const chipsProgress = spring({ frame: local - 20, fps, config: sCfg });

  // Phase 1 (0-120): Initial 3-tool comparison appears
  // Phase 2 (120-200): Add Perplexity — chip activates, 4th column slides in
  // Phase 3 (200-300): Highlight "Quality Index" row showing Claude winning
  // Phase 4 (300-380): Remove ChatGPT — chip deactivates, column collapses
  // Phase 5 (380-480): Editorial picks animate in with highlight on "Best for Research"

  const addPerplexity = local >= 135;
  const highlightRow = local >= 210 && local < 310;
  const removeChatGPT = local >= 310;
  const showEditorial = local >= 370;

  const perplexityColProgress = spring({ frame: local - 135, fps, config: { damping: 14, mass: 0.5 } });
  const chatgptColFade = removeChatGPT
    ? 1 - spring({ frame: local - 310, fps, config: { damping: 16, mass: 0.5 } })
    : 1;

  const selectedTools = (() => {
    const tools: { name: string; key: keyof (typeof METRICS)[0]; opacity: number }[] = [];
    if (!removeChatGPT) tools.push({ name: 'ChatGPT', key: 'chatgpt', opacity: chatgptColFade });
    tools.push({ name: 'Claude', key: 'claude', opacity: 1 });
    tools.push({ name: 'Gemini', key: 'gemini', opacity: 1 });
    if (addPerplexity) tools.push({ name: 'Perplexity', key: 'perplexity', opacity: perplexityColProgress });
    return tools;
  })();

  const chipIsSelected = (name: string) => {
    if (name === 'ChatGPT') return !removeChatGPT;
    if (name === 'Perplexity') return addPerplexity;
    if (name === 'Claude' || name === 'Gemini') return true;
    return false;
  };

  const perplexityPulse =
    local >= 130 && local < 145
      ? interpolate(local, [130, 137, 145], [1, 1.1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1;
  const chatgptPulse =
    local >= 305 && local < 320
      ? interpolate(local, [305, 312, 320], [1, 0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : 1;

  const chipStyle = (name: string): React.CSSProperties => {
    const sel = chipIsSelected(name);
    const pulse = name === 'Perplexity' ? perplexityPulse : name === 'ChatGPT' ? chatgptPulse : 1;
    return {
      padding: '5px 12px',
      fontSize: 12,
      fontFamily,
      fontWeight: 600,
      borderRadius: BRAND.radius,
      backgroundColor: sel ? ACCENT : DARK,
      color: sel ? '#FFFFFF' : TEXT,
      transform: `scale(${pulse})`,
    };
  };

  const cellBase: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: 12,
    fontFamily,
    borderBottom: `1px solid ${BORDER}`,
    textAlign: 'center',
  };

  // Cursor for interactions
  const showCursor = (local >= 110 && local < 150) || (local >= 290 && local < 325);
  const cursorX =
    local < 150
      ? interpolate(local, [110, 130], [300, 340], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(local, [290, 310], [340, 85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cursorY =
    local < 150
      ? interpolate(local, [110, 130], [200, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(local, [290, 310], [95, 95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

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
            <div style={tabStyle(false)}>Content</div>
            <div style={tabStyle(true)}>Compare</div>
          </div>
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, fontFamily }}>Sample Academy</span>
        </nav>

        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'hidden', backgroundColor: BASE }}>
          <div
            style={{
              opacity: headerProgress,
              transform: `translateY(${interpolate(headerProgress, [0, 1], [15, 0])}px)`,
              marginBottom: 12,
            }}
          >
            <div style={{ fontFamily, fontWeight: 800, fontSize: 24, color: TEXT, marginBottom: 4 }}>
              Compare AI Tools
            </div>
            <div style={{ fontFamily, fontSize: 13, color: MUTED }}>Select tools to compare side-by-side</div>
          </div>

          {/* Chip row */}
          <div
            style={{
              opacity: chipsProgress,
              transform: `translateY(${interpolate(chipsProgress, [0, 1], [10, 0])}px)`,
              display: 'flex',
              gap: 6,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {ALL_CHIPS.map((c) => (
              <div key={c.name} style={chipStyle(c.name)}>
                {c.name}
              </div>
            ))}
          </div>

          {/* Table — card-white float on linen */}
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: BRAND.radiusWindow,
              backgroundColor: CARD,
              boxShadow: SHADOW.card,
              overflow: 'hidden',
              marginBottom: showEditorial ? 12 : 0,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...cellBase,
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      color: MUTED,
                      backgroundColor: DARK,
                      minWidth: 120,
                    }}
                  >
                    Metric
                  </th>
                  {selectedTools.map((t) => (
                    <th
                      key={t.name}
                      style={{
                        ...cellBase,
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        color: MUTED,
                        backgroundColor: DARK,
                        opacity: t.opacity,
                      }}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((row, rowIdx) => {
                  const rowProgress = spring({
                    frame: local - 30 - rowIdx * 6,
                    fps,
                    config: { damping: 16, mass: 0.4 },
                  });
                  const isHighlighted = highlightRow && row.metric === 'Quality Index';

                  return (
                    <tr
                      key={row.metric}
                      style={{
                        opacity: rowProgress,
                        backgroundColor: isHighlighted ? ACCENT_SOFT : undefined,
                      }}
                    >
                      <td
                        style={{
                          ...cellBase,
                          textAlign: 'left',
                          fontWeight: 700,
                          color: TEXT,
                          backgroundColor: isHighlighted ? ACCENT_SOFT : DARK,
                        }}
                      >
                        {row.metric}
                      </td>
                      {selectedTools.map((t) => {
                        const val = row[t.key as keyof typeof row] as string;
                        const isBest = isHighlighted && t.key === 'claude';
                        return (
                          <td
                            key={t.name}
                            style={{
                              ...cellBase,
                              color: isBest ? ACCENT : TEXT,
                              opacity: t.opacity,
                              fontWeight: isBest ? 800 : 400,
                              backgroundColor: isBest ? ACCENT_SOFT : isHighlighted ? ACCENT_SOFT : undefined,
                            }}
                          >
                            {val}
                            {isBest && (
                              <span style={{ color: ACCENT, marginLeft: 4, fontSize: 10 }}>★</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Editorial picks — card-white tiles with window shadow on focus */}
          {showEditorial && (
            <div>
              <div
                style={{
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 15,
                  color: TEXT,
                  marginBottom: 8,
                  opacity: spring({ frame: local - 370, fps, config: sCfg }),
                }}
              >
                Best For…
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {EDITORIAL.map((pick, i) => {
                  const pickProgress = spring({
                    frame: local - 380 - i * 10,
                    fps,
                    config: { damping: 16, mass: 0.5 },
                  });
                  const isResearchPick = pick.category === 'Best for Research';
                  const glowProgress = isResearchPick
                    ? spring({ frame: local - 430, fps, config: { damping: 12, mass: 0.6 } })
                    : 0;
                  const focused = isResearchPick && glowProgress > 0.5;

                  return (
                    <div
                      key={pick.category}
                      style={{
                        opacity: pickProgress,
                        transform: `translateY(${interpolate(pickProgress, [0, 1], [20, 0])}px) scale(${
                          isResearchPick
                            ? interpolate(glowProgress, [0, 1], [1, 1.03])
                            : 1
                        })`,
                        padding: '12px 14px',
                        backgroundColor: CARD,
                        border: `1px solid ${focused ? ACCENT : BORDER}`,
                        borderRadius: BRAND.radiusWindow,
                        boxShadow: focused ? SHADOW.cardHover : SHADOW.card,
                      }}
                    >
                      <div
                        style={{
                          fontFamily,
                          fontWeight: 700,
                          fontSize: 13,
                          color: ACCENT,
                          marginBottom: 4,
                        }}
                      >
                        {pick.category}
                      </div>
                      <div style={{ fontFamily, fontSize: 12, color: TEXT }}>
                        <span style={{ fontWeight: 700 }}>{pick.winner}</span>
                        <span style={{ color: MUTED }}> — {pick.reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cursor */}
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
