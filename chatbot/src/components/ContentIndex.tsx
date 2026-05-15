'use client';

import { useState, useMemo } from 'react';
import type { ToolData } from '@/lib/content-types';
import { getCapabilityCount } from '@/lib/content-types';
import { ToolCard } from './ToolCard';
import { ToolRow } from './ToolRow';
import { ViewToggle } from './ViewToggle';
import { FilterBar } from './FilterBar';

export function ContentIndex({ tools }: { tools: ToolData[] }) {
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

  const totalSupported = tools.reduce((sum, t) => sum + getCapabilityCount(t).supported, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font)' }}>
          AI Tools Repository
        </h1>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
          {tools.length} tools tracked &middot; {totalSupported} total capabilities mapped
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
          }}
        >
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((tool) => (
            <ToolRow key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
