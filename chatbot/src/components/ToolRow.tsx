'use client';

import Link from 'next/link';
import type { ToolData } from '@/lib/content-types';
import { getCapabilityCount } from '@/lib/content-types';

const PRIORITY_LABEL: Record<string, string> = { P0: 'Essential', P1: 'Supplementary' };

export function ToolRow({ tool }: { tool: ToolData }) {
  const { supported, total } = getCapabilityCount(tool);
  const isP0 = tool.priority === 'P0';

  return (
    <Link
      href={`/content/${tool.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        textDecoration: 'none',
        color: 'var(--text)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.75rem 1rem',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(28, 28, 28, 0.08)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <span
        style={{
          fontSize: '0.625rem',
          fontWeight: 700,
          padding: '0.125rem 0.375rem',
          borderRadius: 'var(--radius)',
          backgroundColor: isP0 ? 'var(--accent)' : 'var(--accent-soft)',
          color: isP0 ? '#fff' : 'var(--accent)',
          fontFamily: 'var(--font)',
          flexShrink: 0,
        }}
      >
        {PRIORITY_LABEL[tool.priority]}
      </span>

      <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 120, fontFamily: 'var(--font)' }}>
        {tool.name}
      </span>

      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 80, fontFamily: 'var(--font)' }}>
        {tool.vendor}
      </span>

      <span
        style={{
          flex: 1,
          fontSize: '0.8125rem',
          color: 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {tool.description}
      </span>

      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font)',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {supported}/{total} cap.
      </span>
    </Link>
  );
}
