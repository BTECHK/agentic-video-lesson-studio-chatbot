'use client';

import Link from 'next/link';
import type { ToolData, SourceEntry } from '@/lib/content-types';
import { getCapabilityCount } from '@/lib/content-types';
import { CapabilityAccordion } from './CapabilityAccordion';

export function ToolDetail({ tool, sources }: { tool: ToolData; sources: SourceEntry[] }) {
  const { supported, total } = getCapabilityCount(tool);
  const isP0 = tool.priority === 'P0';
  const capEntries = Object.entries(tool.capabilities);

  const allVersionHistory = capEntries
    .flatMap(([, cap]) => cap.versionHistory)
    .sort((a, b) => b.date.localeCompare(a.date));

  const uniqueVersions = allVersionHistory.filter(
    (v, i, arr) => arr.findIndex((x) => x.version === v.version && x.date === v.date) === i,
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <Link
        href="/content"
        style={{
          fontSize: '0.8125rem',
          color: 'var(--accent)',
          textDecoration: 'none',
          fontFamily: 'var(--font)',
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '1rem',
        }}
      >
        &larr; Back to all tools
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font)' }}>
            {tool.name}
          </h1>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius)',
              backgroundColor: isP0 ? 'var(--accent)' : 'var(--accent-soft)',
              color: isP0 ? '#fff' : 'var(--accent)',
              fontFamily: 'var(--font)',
            }}
          >
            {tool.priority}
          </span>
        </div>

        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
          {tool.vendor} &middot;{' '}
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            {tool.url}
          </a>
        </p>

        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 700 }}>
          {tool.description}
        </p>
      </div>

      {/* Capability Overview Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', fontFamily: 'var(--font)' }}>
          Capabilities ({supported}/{total})
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {capEntries.map(([key, cap]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font)',
                padding: '0.375rem 0.625rem',
                borderRadius: 'var(--radius)',
                backgroundColor: cap.supported ? 'var(--accent-soft)' : 'var(--bg-alt)',
                color: cap.supported ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              <span>{cap.supported ? '✓' : '✗'}</span>
              <span>
                {key
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Capability Details (Accordions) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', fontFamily: 'var(--font)' }}>
          Capability Details
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {capEntries.map(([key, cap]) => (
            <CapabilityAccordion key={key} category={key} capability={cap} />
          ))}
        </div>
      </div>

      {/* Version History */}
      {uniqueVersions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', fontFamily: 'var(--font)' }}>
            Version History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {uniqueVersions.slice(0, 10).map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'baseline',
                  fontSize: '0.8125rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontFamily: 'var(--font)',
                    color: 'var(--accent)',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    minWidth: 70,
                  }}
                >
                  {v.date}
                </span>
                <span style={{ fontWeight: 600 }}>{v.version}</span>
                <span style={{ color: 'var(--text-muted)' }}>{v.changes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', fontFamily: 'var(--font)' }}>
            Sources
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {sources.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: '0.8125rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <span style={{ color: 'var(--accent)' }}>&#128279;</span>
                <span>{s.title}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 'auto', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
