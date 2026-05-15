'use client';

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: 'tile' | 'list';
  onViewChange: (v: 'tile' | 'list') => void;
}) {
  const btn = (mode: 'tile' | 'list', label: string): React.CSSProperties => ({
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font)',
    fontWeight: 600,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    backgroundColor: view === mode ? 'var(--accent)' : 'var(--bg-card)',
    color: view === mode ? '#fff' : 'var(--text)',
  });

  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <button style={btn('tile', 'Tiles')} onClick={() => onViewChange('tile')}>
        ▦ Tiles
      </button>
      <button style={btn('list', 'List')} onClick={() => onViewChange('list')}>
        ☰ List
      </button>
    </div>
  );
}
