'use client';

import { useState } from 'react';
import type { Citation } from '@/lib/types';

export function CitationBadge({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center px-1.5 py-0.5 text-xs cursor-pointer"
        style={{
          backgroundColor: 'var(--accent-soft)',
          color: 'var(--accent)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font)',
          border: 'none',
        }}
      >
        [{citation.module}, {citation.lesson}]
      </button>
      {expanded && (
        <div
          className="absolute left-0 mt-1 p-3 shadow-lg text-left text-sm z-10"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            minWidth: '220px',
          }}
        >
          <p className="font-semibold text-sm">{citation.lesson}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {citation.module}
            {citation.tool && ` | ${citation.tool}`}
          </p>
          {citation.verifiedDate && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Verified: {citation.verifiedDate}
            </p>
          )}
          <p className="mt-2 text-xs">{citation.snippet}</p>
        </div>
      )}
    </span>
  );
}
