import Link from 'next/link';
import { getLessonDirectory } from '@/lib/lesson-directory';

interface HubLink {
  label: string;
  href: string;
  description: string;
}

interface Hub {
  heading: string;
  blurb: string;
  links: HubLink[];
}

const HUBS: Hub[] = [
  {
    heading: 'Lesson Planning',
    blurb: 'Generate scripts and track lessons. Finished videos are reviewed async via the Drive bundle (Studio is parked until cloud).',
    links: [
      { label: 'Generate', href: '/studio/generate', description: 'Outline → fact-checked script → MP4.' },
      { label: 'Lesson Library', href: '/studio/menu', description: 'Every lesson and its render status.' },
    ],
  },
  {
    heading: 'Repository',
    blurb: 'The source-of-truth dataset on the AI tools the course teaches.',
    links: [
      { label: 'Tool Repository', href: '/content', description: '12 tools — capabilities, limitations, official sources.' },
      { label: 'Tool Comparison', href: '/content/compare', description: 'Side-by-side specs and benchmarks with attribution.' },
    ],
  },
  {
    heading: 'Operations',
    blurb: 'Day-to-day tooling that keeps content current and answerable.',
    links: [
      { label: 'Ask Tutor', href: '/chat', description: 'Course-grounded assistant with citations.' },
      { label: 'Ingestion', href: '/ingestion', description: 'Freshness status and manual content refresh.' },
    ],
  },
];

export const dynamic = 'force-dynamic';

export default function Home() {
  const lessons = getLessonDirectory();
  const stats = [
    { label: 'Lessons', value: lessons.length },
    { label: 'Videos rendered', value: lessons.filter((l) => l.hasVideo).length },
    { label: 'Drafts pending', value: lessons.filter((l) => l.hasDraft).length },
    { label: 'Stale scenes', value: lessons.reduce((n, l) => n + l.staleCount, 0) },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 32px 32px' }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            margin: '0 0 14px',
          }}
        >
          Internal Console
        </p>
        <h1
          style={{
            fontSize: 'clamp(30px, 4.5vw, 50px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            margin: '0 0 16px',
            maxWidth: 680,
          }}
        >
          The control room for the
          <br />
          <span style={{ color: 'var(--accent)' }}>Sample Academy content system.</span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            fontWeight: 500,
            lineHeight: 1.55,
            color: 'var(--text-muted)',
            maxWidth: 620,
            margin: 0,
          }}
        >
          This is the team-facing workspace for building lessons, maintaining the tool
          repository, and keeping content fresh. The student-facing course lives on Teachable;
          the public marketing page is a <Link href="/marketing" style={{ color: 'var(--accent)', fontWeight: 600 }}>separate surface</Link>.
        </p>
      </section>

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '0 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                padding: '16px 20px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: s.label === 'Stale scenes' && s.value > 0 ? 'var(--limitation-text)' : 'var(--text)',
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '0 32px 80px', display: 'flex', flexDirection: 'column', gap: 36 }}>
        {HUBS.map((hub) => (
          <div key={hub.heading}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 2px' }}>
                {hub.heading}
              </h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>{hub.blurb}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {hub.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hub-card"
                  style={{
                    display: 'block',
                    padding: '20px 22px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 6px', color: 'var(--text)' }}>
                    {link.label}
                  </h3>
                  <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
