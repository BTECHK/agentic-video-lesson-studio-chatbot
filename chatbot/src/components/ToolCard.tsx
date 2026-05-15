'use client';

import Link from 'next/link';
import type { ToolData } from '@/lib/content-types';
import { getCapabilityCount } from '@/lib/content-types';

const PRIORITY_LABEL: Record<string, string> = { P0: 'Essential', P1: 'Supplementary' };

export function ToolCard({ tool }: { tool: ToolData }) {
  const { supported, total } = getCapabilityCount(tool);
  const isP0 = tool.priority === 'P0';

  return (
    <Link
      href={`/content/${tool.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'var(--text)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(28, 28, 28, 0.1)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font)' }}>
          {tool.name}
        </h3>
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
          {PRIORITY_LABEL[tool.priority]}
        </span>
      </div>

      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
        {tool.vendor}
      </p>

      <p
        style={{
          margin: '0 0 0.75rem',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: 'var(--text)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tool.description}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font)',
          fontWeight: 500,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: supported > total / 2 ? 'var(--accent)' : 'var(--text-muted)',
          }}
        />
        {supported}/{total} capabilities
      </div>
    </Link>
  );
}
