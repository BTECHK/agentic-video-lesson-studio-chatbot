'use client';

import type { Status } from '@/lib/studio-timeline';

/**
 * Status pill. `fresh` renders nothing — a healthy timeline stays visually quiet
 * ("set and forget"). Only stale/error introduce a badge, so attention is drawn
 * only where needed. Status is conveyed by glyph + text + colour, never colour
 * alone (a11y), with visually-hidden text for screen readers.
 */
export function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' }) {
  if (status === 'fresh') return null;

  const stale = status === 'stale';
  const fontSize = size === 'sm' ? 10 : 12;
  const pad = size === 'sm' ? '1px 5px' : '2px 7px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        padding: pad,
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font)',
        whiteSpace: 'nowrap',
        background: stale ? 'var(--limitation-bg)' : 'var(--accent)',
        color: stale ? 'var(--limitation-text)' : '#fff',
        border: stale ? '1px solid var(--limitation-border)' : '1px solid var(--accent)',
      }}
    >
      <span aria-hidden style={{ fontSize: fontSize - 1 }}>{stale ? '↻' : '!'}</span>
      {stale ? 'stale' : 'error'}
    </span>
  );
}
