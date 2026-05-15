'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const pathname = usePathname();
  const isContent = pathname.startsWith('/content');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0 0.75rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: active ? 'var(--accent)' : 'var(--text)',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    fontFamily: 'var(--font)',
    fontSize: '0.875rem',
    fontWeight: 600,
  });

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        padding: '0 1rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font)',
      }}
    >
      <div style={{ display: 'flex', height: '100%', gap: '0.5rem' }}>
        <Link href="/" style={tabStyle(!isContent)}>
          Chat
        </Link>
        <Link href="/content" style={tabStyle(isContent)}>
          Content
        </Link>
      </div>
      <span
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: 500,
          fontFamily: 'var(--font)',
        }}
      >
        Sample Academy
      </span>
    </nav>
  );
}
