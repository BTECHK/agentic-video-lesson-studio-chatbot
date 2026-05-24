'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Home', href: '/', match: (p: string) => p === '/' },
  { label: 'Chat', href: '/chat', match: (p: string) => p === '/chat' },
  { label: 'Tool Repository', href: '/content', match: (p: string) => p.startsWith('/content') && !p.startsWith('/content/compare') },
  { label: 'Tool Comparison', href: '/content/compare', match: (p: string) => p.startsWith('/content/compare') },
  { label: 'Studio', href: '/studio', match: (p: string) => p === '/studio' || (p.startsWith('/studio') && !p.startsWith('/studio/generate')) },
  { label: 'Generate', href: '/studio/generate', match: (p: string) => p.startsWith('/studio/generate') },
  { label: 'Ingestion', href: '/ingestion', match: (p: string) => p.startsWith('/ingestion') },
];

export function TopNav() {
  const pathname = usePathname();

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
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
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
              }}
            >
              {tab.label}
            </Link>
          );
        })}
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
