'use client';

export function LandingHero({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 48px',
        backgroundColor: 'var(--bg-base)',
        textAlign: 'center',
      }}
    >
      {/* Logo + name */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
          }}
        >
          Sample
        </span>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginLeft: '6px',
          }}
        >
          Academy
        </span>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
          maxWidth: '720px',
          margin: '0 0 16px',
        }}
      >
        Practical AI skills for{' '}
        <span style={{ color: 'var(--accent)' }}>working professionals</span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '18px',
          fontWeight: 500,
          lineHeight: 1.5,
          color: 'var(--text-muted)',
          maxWidth: '560px',
          margin: '0 0 40px',
        }}
      >
        Learn to use AI tools and keep your skills relevant.
        Short animated lessons and practice exercises.
      </p>

      {/* Lesson preview card */}
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--accent)',
            }}
          >
            Preview
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            Module 1 — Introduction to AI Tools
          </span>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src="/lessons/module-1-slides.html"
            title="Module 1: Introduction to AI Tools"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onCtaClick}
        style={{
          marginTop: '40px',
          padding: '14px 32px',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius)',
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'var(--font)',
          cursor: 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        Start Learning
      </button>
    </section>
  );
}
