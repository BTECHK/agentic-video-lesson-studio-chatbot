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

function formatCategory(cat: string): string {
  return cat
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function FilterBar({
  priority,
  capability,
  onPriorityChange,
  onCapabilityChange,
}: {
  priority: 'all' | 'P0' | 'P1';
  capability: string;
  onPriorityChange: (p: 'all' | 'P0' | 'P1') => void;
  onCapabilityChange: (c: string) => void;
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
            {p === 'all' ? 'All' : p}
          </button>
        ))}
      </div>

      <select
        value={capability}
        onChange={(e) => onCapabilityChange(e.target.value)}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text)',
          cursor: 'pointer',
        }}
      >
        <option value="">All capabilities</option>
        {CAPABILITY_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {formatCategory(cat)}
          </option>
        ))}
      </select>
    </div>
  );
}
