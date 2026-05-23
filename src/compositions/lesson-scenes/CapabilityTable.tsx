import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { CapabilityTableContent } from './content-types';
import { BRAND, MUTED, HAIRLINE, SceneFrame, Eyebrow, Glide, useGlideIn } from './shared';

type Cell = 'B' | 'Y' | 'L' | '-';

/**
 * `capability-table` — capability × tool matrix. Header row of tools, then
 * rows fade+slide in (staggered). Cells: B (Best, accent), Y (Yes, neutral),
 * L (Limited, faint), - (none, dash).
 */
export const CapabilityTable: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as CapabilityTableContent;
  const title = useGlideIn(12, 22);
  const footnote = useGlideIn(40, 14);
  const gridTemplate = `1.6fr repeat(${c.headers.length}, 1fr)`;

  return (
    <SceneFrame align="flex-start" paddingX={140}>
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.extraBold,
          fontSize: 60,
          letterSpacing: '-0.02em',
        }}
      >
        {c.title}
      </h1>

      <div style={{ width: '100%', marginTop: 16 }}>
        {/* header row */}
        <Glide delay={28} fromY={12}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              alignItems: 'end',
              paddingBottom: 14,
              borderBottom: `2px solid ${HAIRLINE}`,
            }}
          >
            <div />
            {c.headers.map((h) => (
              <div
                key={h}
                style={{
                  textAlign: 'center',
                  fontWeight: BRAND.font.weights.bold,
                  fontSize: 24,
                  color: BRAND.colors.text,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        </Glide>

        {/* rows */}
        {c.rows.map((row, i) => (
          <Glide key={row.id} delay={42 + i * 8} fromY={14}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: `1px solid ${HAIRLINE}`,
              }}
            >
              <div
                style={{
                  fontWeight: BRAND.font.weights.semiBold,
                  fontSize: 26,
                  color: BRAND.colors.text,
                }}
              >
                {row.label}
              </div>
              {row.cells.map((cell, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'center' }}>
                  <CellMark value={cell as Cell} />
                </div>
              ))}
            </div>
          </Glide>
        ))}
      </div>

      {c.footnote && (
        <div
          style={{
            ...footnote,
            marginTop: 10,
            fontWeight: BRAND.font.weights.regular,
            fontSize: 22,
            fontStyle: 'italic',
            color: MUTED,
          }}
        >
          {c.footnote}
        </div>
      )}
    </SceneFrame>
  );
};

const CellMark: React.FC<{ value: Cell }> = ({ value }) => {
  if (value === '-') {
    return <span style={{ color: HAIRLINE, fontSize: 32, fontWeight: 700 }}>—</span>;
  }
  const styles: Record<'B' | 'Y' | 'L', { bg: string; fg: string; border: string }> = {
    B: { bg: BRAND.colors.accent, fg: BRAND.colors.bgBase, border: BRAND.colors.accent },
    Y: { bg: 'transparent', fg: BRAND.colors.accent, border: BRAND.colors.accent },
    L: { bg: 'transparent', fg: MUTED, border: HAIRLINE },
  };
  const s = styles[value];
  return (
    <div
      style={{
        minWidth: 44,
        height: 44,
        padding: '0 14px',
        borderRadius: 999,
        backgroundColor: s.bg,
        color: s.fg,
        border: `2px solid ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: BRAND.font.weights.bold,
        fontSize: 20,
      }}
    >
      {value === 'L' ? 'Limited' : value === 'B' ? 'Best' : '✓'}
    </div>
  );
};
