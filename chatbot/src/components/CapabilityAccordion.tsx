'use client';

import { useState } from 'react';
import type { ToolCapability } from '@/lib/content-types';

function formatCategory(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function CapabilityAccordion({
  category,
  capability,
}: {
  category: string;
  capability: ToolCapability;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: '0.75rem 1rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: capability.supported ? 'var(--accent)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1 }}>{formatCategory(category)}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          {capability.subFeatures.length} features
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', transition: 'transform 0.15s' }}>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.75rem 0', lineHeight: 1.5 }}>
            {capability.summary}
          </p>

          {capability.subFeatures.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.5rem', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Features
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {capability.subFeatures.map((sf) => (
                  <div key={sf.name} style={{ fontSize: '0.8125rem' }}>
                    <strong style={{ fontWeight: 600 }}>{sf.name}</strong>
                    {sf.availableOn && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        ({sf.availableOn.join(', ')})
                      </span>
                    )}
                    <p style={{ margin: '0.125rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                      {sf.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {capability.limitations.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.5rem', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Limitations
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {capability.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}

          {capability.pricingTiers.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 0.5rem', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Pricing
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {capability.pricingTiers.map((pt) => (
                  <div
                    key={pt.tier}
                    style={{
                      flex: '1 1 140px',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--bg-alt)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <strong style={{ fontWeight: 700, fontFamily: 'var(--font)' }}>{pt.tier}</strong>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {pt.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
