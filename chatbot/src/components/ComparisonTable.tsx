'use client';

import type { ToolData } from '@/lib/content-types';
import { getBenchmark, BENCHMARK_SOURCES } from '@/lib/benchmarks';

interface ComparisonTableProps {
  tools: ToolData[];
}

const cellStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font)',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--text-muted)',
  background: 'var(--bg-alt)',
  position: 'sticky',
  top: 0,
};

const toolNameStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  color: 'var(--text)',
  background: 'var(--bg-alt)',
};

const capabilityCategories = [
  'writing-chat',
  'research',
  'file-analysis',
  'document-creation',
  'image-generation',
  'prototyping',
  'personalization',
  'persistent-context',
  'agents',
  'connectors',
  'dictation',
];

const capabilityLabels: Record<string, string> = {
  'writing-chat': 'Writing & Chat',
  research: 'Research',
  'file-analysis': 'File Analysis',
  'document-creation': 'Document Creation',
  'image-generation': 'Image Generation',
  prototyping: 'Prototyping',
  personalization: 'Personalization',
  'persistent-context': 'Persistent Context',
  agents: 'Agents',
  connectors: 'Connectors',
  dictation: 'Dictation',
};

function formatNumber(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString();
}

function formatPrice(n: number | null): string {
  if (n === null) return '—';
  return `$${n}`;
}

function formatContext(tokens: number | null): string {
  if (tokens === null) return '—';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(0)}M`;
  return `${(tokens / 1000).toFixed(0)}K`;
}

export function ComparisonTable({ tools }: ComparisonTableProps) {
  if (tools.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
        Select tools above to compare.
      </p>
    );
  }

  return (
    <div>
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-card)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: tools.length > 2 ? 700 : 500,
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: 140 }}>Metric</th>
            {tools.map((t) => (
              <th key={t.id} style={{ ...headerCellStyle, textAlign: 'center' }}>
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Benchmark rows */}
          <tr>
            <td style={toolNameStyle}>Primary Model</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {b?.primaryModel ?? '—'}
                </td>
              );
            })}
          </tr>
          <tr>
            <td style={toolNameStyle}>Arena ELO</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {formatNumber(b?.arenaElo ?? null)}
                </td>
              );
            })}
          </tr>
          <tr>
            <td style={toolNameStyle}>Quality Index</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {b?.qualityIndex != null ? `${b.qualityIndex}/100` : '—'}
                </td>
              );
            })}
          </tr>
          <tr>
            <td style={toolNameStyle}>Speed (tok/s)</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {formatNumber(b?.speedTps ?? null)}
                </td>
              );
            })}
          </tr>
          <tr>
            <td style={toolNameStyle}>Price (per 1M out)</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {formatPrice(b?.pricePerMTokens ?? null)}
                </td>
              );
            })}
          </tr>
          <tr>
            <td style={toolNameStyle}>Context Window</td>
            {tools.map((t) => {
              const b = getBenchmark(t.id);
              return (
                <td key={t.id} style={{ ...cellStyle, textAlign: 'center' }}>
                  {formatContext(b?.contextWindow ?? null)}
                </td>
              );
            })}
          </tr>

          {/* Capability rows */}
          <tr>
            <td
              colSpan={tools.length + 1}
              style={{
                ...cellStyle,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                color: 'var(--text-muted)',
                background: 'var(--bg-alt)',
                paddingTop: '0.875rem',
              }}
            >
              Capabilities
            </td>
          </tr>
          {capabilityCategories.map((cat) => (
            <tr key={cat}>
              <td style={toolNameStyle}>{capabilityLabels[cat] ?? cat}</td>
              {tools.map((t) => {
                const cap = t.capabilities[cat];
                const supported = cap?.supported ?? false;
                return (
                  <td
                    key={t.id}
                    style={{
                      ...cellStyle,
                      textAlign: 'center',
                      color: supported ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {supported ? '✓' : '✗'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <BenchmarkSources />
    </div>
  );
}

function BenchmarkSources() {
  return (
    <p
      style={{
        marginTop: '0.75rem',
        fontSize: '0.6875rem',
        lineHeight: 1.5,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font)',
      }}
    >
      <strong style={{ fontWeight: 700 }}>Sources.</strong> Model, context window, and price
      are vendor-official (each vendor&rsquo;s own docs, May 2026). Arena ELO is from{' '}
      <a href={BENCHMARK_SOURCES.arenaElo.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
        {BENCHMARK_SOURCES.arenaElo.label}
      </a>{' '}
      (as of {BENCHMARK_SOURCES.arenaElo.asOf}); Quality Index and Speed are from{' '}
      <a href={BENCHMARK_SOURCES.qualityIndex.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
        {BENCHMARK_SOURCES.qualityIndex.label}
      </a>{' '}
      ({BENCHMARK_SOURCES.qualityIndex.asOf}). &ldquo;—&rdquo; means not published, not yet rated, or
      not comparable on that axis (e.g. coding-agent surfaces and answer engines).
    </p>
  );
}
