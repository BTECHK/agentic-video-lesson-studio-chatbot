import React from 'react';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { CapabilityTableContent } from './content-types';
import { BRAND } from '../../brand/tokens';
import { SceneFrame, Eyebrow, Glide, useGlideIn, renderAccented, MUTED } from './shared';

type Cell = 'B' | 'Y' | 'L' | '-';

/**
 * `capability-table` (v2) — capability × tool matrix wrapped in a floating
 * bgCard container. Header row uses bgDark; rows slide+fade in staggered;
 * dividers are border hairlines. Cells: B (Best, accent pill), Y (neutral ✓),
 * L (textMuted "Limited"), - (textDim dash). Settle within first ~7s, hold.
 */
export const CapabilityTable: React.FC<SceneComponentProps> = ({ scene }) => {
  const c = scene.content as unknown as CapabilityTableContent;
  const title = useGlideIn(12, 22);
  const tableIn = useGlideIn(28, 18);
  const footnote = useGlideIn(40, 14);
  const gridTemplate = `1.6fr repeat(${c.headers.length}, 1fr)`;

  return (
    <SceneFrame align="flex-start" paddingX={140}>
      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>
      <h1
        style={{
          ...title,
          margin: 0,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 60,
          letterSpacing: '-0.02em',
        }}
      >
        {renderAccented(c.title)}
      </h1>

      {/* Floating card container */}
      <div
        style={{
          ...tableIn,
          width: '100%',
          background: BRAND.colors.bgCard,
          border: `1px solid ${BRAND.colors.border}`,
          borderRadius: BRAND.radius,
          boxShadow: 'none',
          overflow: 'hidden',
          marginTop: 8,
        }}
      >
        {/* Header row — bgDark, bold tool names */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            background: BRAND.colors.bgDark,
          }}
        >
          <div
            style={{
              padding: '18px 22px',
              fontWeight: BRAND.font.weights.bold,
              fontSize: 18,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: BRAND.colors.textMuted,
            }}
          >
            Capability
          </div>
          {c.headers.map((h) => (
            <div
              key={h}
              style={{
                padding: '18px 12px',
                textAlign: 'center',
                fontWeight: BRAND.font.weights.bold,
                fontSize: 20,
                color: BRAND.colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Data rows — staggered slide+fade, border hairlines */}
        {c.rows.map((row, i) => (
          <Glide key={row.id} delay={42 + i * 8} fromY={12}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                alignItems: 'center',
                borderTop: `1px solid ${BRAND.colors.border}`,
              }}
            >
              <div
                style={{
                  padding: '16px 22px',
                  fontWeight: BRAND.font.weights.semiBold,
                  fontSize: 22,
                  color: BRAND.colors.text,
                }}
              >
                {row.label}
              </div>
              {row.cells.map((cell, j) => (
                <div key={j} style={{ padding: '12px 8px', display: 'flex', justifyContent: 'center' }}>
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
    return (
      <span style={{ color: BRAND.colors.textDim, fontSize: 28, fontWeight: 500 }}>—</span>
    );
  }

  if (value === 'B') {
    // Best → accent pill (accentSoft fill, accent text, full-pill radius)
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '5px 16px',
          borderRadius: 999,
          background: BRAND.colors.accent,
          color: BRAND.colors.bgCard,
          fontWeight: BRAND.font.weights.bold,
          fontSize: 15,
          letterSpacing: '0.02em',
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        Best
      </span>
    );
  }

  if (value === 'Y') {
    // Yes → neutral mark
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 999,
          background: BRAND.colors.bgDark,
          color: BRAND.colors.text,
          fontWeight: BRAND.font.weights.semiBold,
          fontSize: 15,
          minWidth: 48,
          textAlign: 'center',
        }}
      >
        ✓
      </span>
    );
  }

  // L — Limited → textMuted
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: 999,
        background: 'rgba(28,28,28,0.06)',
        color: BRAND.colors.textMuted,
        fontWeight: BRAND.font.weights.semiBold,
        fontSize: 14,
        minWidth: 64,
        textAlign: 'center',
      }}
    >
      Limited
    </span>
  );
};
