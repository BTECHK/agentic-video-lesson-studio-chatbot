import Link from 'next/link';
import { getLessonDirectory } from '@/lib/lesson-directory';

export const dynamic = 'force-dynamic';

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Studio · Menu — the lesson directory. Lists every lesson with at-a-glance status. */
export default function MenuPage() {
  const lessons = getLessonDirectory();
  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-card)',
    padding: '1rem 1.25rem',
  };

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '1.5rem', fontFamily: 'var(--font)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Lessons</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Your lesson directory. Generate or regenerate a lesson&rsquo;s script; finished videos are reviewed via the Drive review bundle.
      </p>

      {lessons.length === 0 && (
        <p style={{ ...card, marginTop: '1rem', color: 'var(--text-muted)' }}>
          No lessons yet. Generate one from an outline to get started.
        </p>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lessons.map((l) => (
          <div key={l.lessonId} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{l.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {l.lessonId} · {l.scenes} scenes · {fmtDuration(l.durationSec)}
                {l.hasVideo && <span> · 🎬 video</span>}
                {l.hasDraft && <span> · ✎ draft</span>}
                {l.staleCount > 0 ? (
                  <span style={{ color: 'var(--limitation-text)' }}> · ↻ {l.staleCount} stale</span>
                ) : (
                  <span> · up to date</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link
                href={`/studio/generate?lesson=${encodeURIComponent(l.lessonId)}`}
                style={{
                  textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, color: '#fff',
                  background: 'var(--accent)', borderRadius: 'var(--radius)', padding: '0.35rem 0.7rem',
                }}
              >
                Generate
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
