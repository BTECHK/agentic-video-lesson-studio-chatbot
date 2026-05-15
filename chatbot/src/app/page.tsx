'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MODULE_TOPICS = [
  { number: '01', title: 'Getting Started with AI Assistants' },
  { number: '02', title: 'Picking the Right Assistant' },
  { number: '03', title: 'Making the Assistant Yours' },
  { number: '04', title: 'Checking the Output' },
  { number: '05', title: 'Mapping a Repetitive Task' },
];

const FEATURES = [
  {
    label: 'Ask Tutor',
    description: 'AI teaching assistant grounded in course content. Get answers with source citations.',
    href: '/chat',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Content Library',
    description: 'Browse 12 AI tools with capabilities, features, limitations, and official sources.',
    href: '/content',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Compare Tools',
    description: 'Side-by-side benchmarks, capability breakdowns, and editorial recommendations.',
    href: '/content/compare',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 49px)', backgroundColor: 'var(--bg-base)' }}>
      {/* Hero */}
      <section
        style={{
          padding: 'clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 64px)',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            Sample Academy
          </p>
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              color: 'var(--text)',
              maxWidth: 640,
              margin: '0 0 20px',
            }}
          >
            Learn to work with
            <br />
            <span style={{ color: 'var(--accent)' }}>AI assistants.</span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              fontWeight: 500,
              lineHeight: 1.55,
              color: 'var(--text-muted)',
              maxWidth: 480,
              margin: 0,
            }}
          >
            Short animated lessons and practice exercises
            for working professionals building careers with AI.
          </p>
        </div>
      </section>

      {/* Module Preview */}
      <section
        style={{
          padding: '0 24px 64px',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            {/* Module header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--accent)',
                  }}
                >
                  Module 1 Preview
                </span>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--text)',
                    margin: '4px 0 0',
                  }}
                >
                  Introduction to AI Tools
                </h2>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-base)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius)',
                  whiteSpace: 'nowrap',
                }}
              >
                13 slides
              </span>
            </div>

            {/* Topic list */}
            <div style={{ padding: '8px 0' }}>
              {MODULE_TOPICS.map((topic, i) => (
                <div
                  key={topic.number}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 16,
                    padding: '12px 24px',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(8px)',
                    transition: `opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.06}s, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.06}s`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {topic.number}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                      lineHeight: 1.4,
                    }}
                  >
                    {topic.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section
        style={{
          padding: '0 24px 80px',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: 'var(--text-muted)',
            marginBottom: 16,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
          }}
        >
          Explore the platform
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {FEATURES.map((feature, i) => (
            <Link
              key={feature.label}
              href={feature.href}
              style={{
                display: 'block',
                padding: '24px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                color: 'inherit',
                transition: `border-color 0.2s, box-shadow 0.2s, opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.55 + i * 0.08}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.55 + i * 0.08}s`,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(139, 38, 53, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ color: 'var(--accent)', marginBottom: 14 }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  margin: '0 0 6px',
                }}
              >
                {feature.label}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Access CTA */}
      <section
        style={{
          padding: '0 24px 96px',
          maxWidth: 960,
          margin: '0 auto',
          textAlign: 'center',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.7s',
        }}
      >
        <Link
          href="/chat"
          style={{
            display: 'inline-block',
            padding: '14px 36px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
          }}
        >
          Start Learning
        </Link>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginTop: 12,
          }}
        >
          Demo mode available — no account required
        </p>
      </section>
    </div>
  );
}
