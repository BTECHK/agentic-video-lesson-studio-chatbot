'use client';

import { useState, useMemo } from 'react';
import type { ToolData } from '@/lib/content-types';
import { editorialPicks } from '@/lib/editorial';
import { ComparisonTable } from './ComparisonTable';

interface ComparisonPageProps {
  tools: ToolData[];
}

const DEFAULT_SELECTION = ['chatgpt', 'claude', 'gemini'];

const chipBase: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font)',
  fontWeight: 600,
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export function ComparisonPage({ tools }: ComparisonPageProps) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTION);

  const toggleTool = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      return [...prev, id];
    });
  };

  const selectedTools = useMemo(
    () => selected.map((id) => tools.find((t) => t.id === id)).filter(Boolean) as ToolData[],
    [selected, tools]
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            margin: '0 0 0.25rem',
            fontSize: '1.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font)',
          }}
        >
          Compare AI Tools
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font)',
          }}
        >
          Select tools to compare side-by-side
        </p>
      </div>

      {/* Tool selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {tools.map((t) => {
          const isSelected = selected.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggleTool(t.id)}
              style={{
                ...chipBase,
                background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                color: isSelected ? '#fff' : 'var(--text)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      <ComparisonTable tools={selectedTools} />

      {/* Editorial picks */}
      <div style={{ marginTop: '2.5rem' }}>
        <h2
          style={{
            margin: '0 0 1rem',
            fontSize: '1.125rem',
            fontWeight: 700,
            fontFamily: 'var(--font)',
          }}
        >
          Best For...
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {editorialPicks.map((pick) => (
            <div
              key={pick.category}
              style={{
                padding: '1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font)',
                  color: 'var(--accent)',
                }}
              >
                {pick.category}
              </h3>
              <p
                style={{
                  margin: '0 0 0.625rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font)',
                }}
              >
                {pick.description}
              </p>
              <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font)' }}>
                <div style={{ marginBottom: '0.375rem' }}>
                  <span style={{ fontWeight: 700 }}>Winner: </span>
                  <span>{tools.find((t) => t.id === pick.winnerId)?.name ?? pick.winnerId}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.375rem' }}>
                    — {pick.winnerReason}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Runner-up: </span>
                  <span>{tools.find((t) => t.id === pick.runnerUpId)?.name ?? pick.runnerUpId}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.375rem' }}>
                    — {pick.runnerUpReason}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
