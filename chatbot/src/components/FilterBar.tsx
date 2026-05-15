'use client';

const CAPABILITY_CATEGORIES = [
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

const PRIORITY_LABELS: Record<string, string> = { all: 'All', P0: 'Essential', P1: 'Supplementary' };

function formatCategory(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function FilterBar({
  priority,
  selectedCapabilities,
  onPriorityChange,
  onCapabilityToggle,
}: {
  priority: 'all' | 'P0' | 'P1';
  selectedCapabilities: string[];
  onPriorityChange: (p: 'all' | 'P0' | 'P1') => void;
  onCapabilityToggle: (c: string) => void;
}) {
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font)',
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    backgroundColor: active ? 'var(--accent)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text)',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {(['all', 'P0', 'P1'] as const).map((p) => (
          <button key={p} style={pillStyle(priority === p)} onClick={() => onPriorityChange(p)}>
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {CAPABILITY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            style={pillStyle(selectedCapabilities.includes(cat))}
            onClick={() => onCapabilityToggle(cat)}
          >
            {formatCategory(cat)}
          </button>
        ))}
      </div>
    </div>
  );
}
