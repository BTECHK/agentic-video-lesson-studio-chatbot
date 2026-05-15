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
const ALT_BG = '#F8F6F3';

const TOOL_CHIPS = [
  { name: 'ChatGPT', selected: true },
  { name: 'Claude', selected: true },
  { name: 'Gemini', selected: true },
  { name: 'Perplexity', selected: false },
];

const TABLE_ROWS = [
  { metric: 'Primary Model', values: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'] },
  { metric: 'Arena ELO', values: ['1,287', '1,268', '1,261'] },
  { metric: 'Quality Index', values: ['89/100', '92/100', '87/100'] },
  { metric: 'Speed (tok/s)', values: ['92', '82', '145'] },
  { metric: 'Context Window', values: ['128K', '200K', '2M'] },
];

const EDITORIAL_PICKS = [
  { category: 'Best for Research', winner: 'Claude', reason: 'Largest context for deep analysis', runnerUp: 'Perplexity', runnerUpReason: 'Real-time web citations' },
  { category: 'Best for Writing', winner: 'ChatGPT', reason: 'Most versatile creative output', runnerUp: 'Claude', runnerUpReason: 'Nuanced, structured prose' },
  { category: 'Best for Speed', winner: 'Gemini', reason: 'Fastest token generation', runnerUp: 'ChatGPT', runnerUpReason: 'Consistent low latency' },
];

export const ComparisonView: React.FC = () => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springCfg = { damping: 18, mass: 0.5 };

  const navProgress = spring({ frame: local, fps, config: springCfg });
  const headerProgress = spring({ frame: local - 10, fps, config: springCfg });
  const chipsProgress = spring({ frame: local - 20, fps, config: springCfg });

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

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    fontSize: 13,
    fontFamily,
    fontWeight: 600,
    borderRadius: BRAND.radius,
    border: `1px solid ${selected ? ACCENT : BORDER}`,
    backgroundColor: selected ? ACCENT : CARD_BG,
    color: selected ? '#FFFFFF' : TEXT,
  });

  const cellBase: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 13,
    fontFamily,
    borderBottom: `1px solid ${BORDER}`,
    textAlign: 'center',
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
            <div style={tabStyle(false)}>Content</div>
            <div style={tabStyle(true)}>Compare</div>
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
              marginBottom: 16,
            }}
          >
            <div style={{ fontFamily, fontWeight: 800, fontSize: 26, color: TEXT, marginBottom: 4 }}>
              Compare AI Tools
            </div>
            <div style={{ fontFamily, fontSize: 14, color: MUTED }}>
              Select tools to compare side-by-side
            </div>
          </div>

          {/* Tool chips */}
          <div
            style={{
              opacity: chipsProgress,
              transform: `translateY(${interpolate(chipsProgress, [0, 1], [10, 0])}px)`,
              display: 'flex',
              gap: 8,
              marginBottom: 20,
            }}
          >
            {TOOL_CHIPS.map((chip) => (
              <div key={chip.name} style={chipStyle(chip.selected)}>
                {chip.name}
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div
            style={{
              border: `1px solid ${BORDER}`,
              borderRadius: BRAND.radius,
              backgroundColor: CARD_BG,
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...cellBase, textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: MUTED, backgroundColor: ALT_BG, minWidth: 140 }}>
                    Metric
                  </th>
                  {['ChatGPT', 'Claude', 'Gemini'].map((name) => (
                    <th key={name} style={{ ...cellBase, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: MUTED, backgroundColor: ALT_BG }}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, rowIdx) => {
                  const rowProgress = spring({
                    frame: local - 35 - rowIdx * 8,
                    fps,
                    config: { damping: 16, mass: 0.4 },
                  });

                  return (
                    <tr
                      key={row.metric}
                      style={{
                        opacity: rowProgress,
                        transform: `translateX(${interpolate(rowProgress, [0, 1], [-15, 0])}px)`,
                      }}
                    >
                      <td style={{ ...cellBase, textAlign: 'left', fontWeight: 700, color: TEXT, backgroundColor: ALT_BG }}>
                        {row.metric}
                      </td>
                      {row.values.map((val, i) => (
                        <td key={i} style={{ ...cellBase, color: TEXT }}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Editorial picks */}
          <div>
            <div
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: 18,
                color: TEXT,
                marginBottom: 10,
                opacity: spring({ frame: local - 80, fps, config: springCfg }),
              }}
            >
              Best For...
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {EDITORIAL_PICKS.map((pick, i) => {
                const pickProgress = spring({
                  frame: local - 90 - i * 10,
                  fps,
                  config: { damping: 16, mass: 0.5 },
                });

                return (
                  <div
                    key={pick.category}
                    style={{
                      opacity: pickProgress,
                      transform: `translateY(${interpolate(pickProgress, [0, 1], [20, 0])}px)`,
                      padding: '14px 16px',
                      backgroundColor: CARD_BG,
                      border: `1px solid ${BORDER}`,
                      borderRadius: BRAND.radius,
                    }}
                  >
                    <div style={{ fontFamily, fontWeight: 700, fontSize: 14, color: ACCENT, marginBottom: 6 }}>
                      {pick.category}
                    </div>
                    <div style={{ fontFamily, fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>Winner: </span>
                      <span>{pick.winner}</span>
                      <span style={{ color: MUTED, marginLeft: 6 }}> &mdash; {pick.reason}</span>
                    </div>
                    <div style={{ fontFamily, fontSize: 12, color: MUTED }}>
                      <span style={{ fontWeight: 600 }}>Runner-up: </span>
                      <span>{pick.runnerUp}</span>
                      <span style={{ marginLeft: 6 }}> &mdash; {pick.runnerUpReason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
