'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  match: (p: string) => boolean;
}

interface NavGroup {
  heading: string | null;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [{ label: 'Home', href: '/', match: (p) => p === '/' }],
  },
  {
    heading: 'Lesson Planning',
    items: [
      { label: 'Studio', href: '/studio', match: (p) => p === '/studio' },
      { label: 'Generate', href: '/studio/generate', match: (p) => p.startsWith('/studio/generate') },
      { label: 'Lesson Library', href: '/studio/menu', match: (p) => p.startsWith('/studio/menu') },
    ],
  },
  {
    heading: 'Repository',
    items: [
      {
        label: 'Tool Repository',
        href: '/content',
        match: (p) => p.startsWith('/content') && !p.startsWith('/content/compare'),
      },
      { label: 'Tool Comparison', href: '/content/compare', match: (p) => p.startsWith('/content/compare') },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Ask Tutor', href: '/chat', match: (p) => p === '/chat' },
      { label: 'Ingestion', href: '/ingestion', match: (p) => p.startsWith('/ingestion') },
    ],
  },
];

const groupHeadingStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '0 0.875rem',
  margin: '0 0 0.375rem',
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: 248,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        fontFamily: 'var(--font)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ fontSize: '1.0625rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Sample Academy
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginTop: 2,
          }}
        >
          Internal Console
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0.375rem', flex: 1 }}>
        {GROUPS.map((group, gi) => (
          <div key={group.heading ?? `g${gi}`}>
            {group.heading && <p style={groupHeadingStyle}>{group.heading}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '0.5rem 0.875rem',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--accent)' : 'var(--text)',
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: link out to the (future public) marketing surface */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
        <Link
          href="/marketing"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          Marketing site ↗
        </Link>
      </div>
    </nav>
  );
}
