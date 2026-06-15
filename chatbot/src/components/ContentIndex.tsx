'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ToolData } from '@/lib/content-types';
import type { FreshnessLevel } from '@/lib/ingestion-status';
import { getCapabilityCount, groupIntoProducts } from '@/lib/content-types';
import { ToolCard } from './ToolCard';
import { ToolRow } from './ToolRow';
import { ViewToggle } from './ViewToggle';
import { FilterBar } from './FilterBar';

export interface VendorFreshness {
  level: FreshnessLevel;
  skipped: boolean;
}

/** Source freshness per tool vendor display name (e.g. "OpenAI"). */
export type VendorFreshnessMap = Record<string, VendorFreshness>;

export function ContentIndex({
  tools,
  vendorFreshness = {},
}: {
  tools: ToolData[];
  vendorFreshness?: VendorFreshnessMap;
}) {
  const [view, setView] = useState<'tile' | 'list'>('tile');
  const [priority, setPriority] = useState<'all' | 'P0' | 'P1'>('all');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);

  const toggleCapability = (cat: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (priority !== 'all' && t.priority !== priority) return false;
      if (selectedCapabilities.length > 0 && !selectedCapabilities.some((cap) => t.capabilities[cap]?.supported)) return false;
      return true;
    });
  }, [tools, priority, selectedCapabilities]);

  const products = useMemo(() => groupIntoProducts(filtered), [filtered]);
  const productCount = useMemo(() => groupIntoProducts(tools).length, [tools]);

  const totalSupported = tools.reduce((sum, t) => sum + getCapabilityCount(t).supported, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font)' }}>
          AI Tools Repository
        </h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
          {productCount} products &middot; {tools.length} surfaces tracked &middot; {totalSupported} capabilities mapped
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <FilterBar
          priority={priority}
          selectedCapabilities={selectedCapabilities}
          onPriorityChange={setPriority}
          onCapabilityToggle={toggleCapability}
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.875rem' }}>
          No tools match the current filters.
        </p>
      )}

      {view === 'tile' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.75rem',
            alignItems: 'start',
          }}
        >
          {products.map((product) => {
            const extra = product.surfaces.filter((s) => s.id !== product.primary.id);
            return (
              <div key={product.productId} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ToolCard tool={product.primary} freshness={vendorFreshness[product.primary.vendor]} />
                {extra.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                      alignItems: 'center',
                      paddingLeft: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      Surfaces
                    </span>
                    {extra.map((s) => (
                      <SurfaceChip key={s.id} surface={s} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {products.map((product) => {
            const extra = product.surfaces.filter((s) => s.id !== product.primary.id);
            return (
              <div key={product.productId} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <ToolRow tool={product.primary} />
                {extra.map((s) => (
                  <div key={s.id} style={{ marginLeft: '1.5rem' }}>
                    <ToolRow tool={s} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SurfaceChip({ surface }: { surface: ToolData }) {
  return (
    <Link
      href={`/content/${surface.id}`}
      style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        fontFamily: 'var(--font)',
        padding: '0.1875rem 0.5rem',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--accent-soft)',
        color: 'var(--accent)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {surface.surface}
    </Link>
  );
}
