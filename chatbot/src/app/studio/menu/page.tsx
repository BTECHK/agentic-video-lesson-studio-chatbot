import Link from 'next/link';
import { getLessonDirectory } from '@/lib/lesson-directory';
import type { GateState } from '@/lib/lesson-gates';

export const dynamic = 'force-dynamic';

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** DoD gate badge palette: pass = feature (green), fix = limitation (red), missing = neutral. */
function gateColors(state: GateState): { border: string; color: string; bg: string } {
  if (state === 'pass') return { border: 'var(--feature-border)', color: 'var(--feature-text)', bg: 'var(--feature-bg)' };
  if (state === 'fix') return { border: 'var(--limitation-border)', color: 'var(--limitation-text)', bg: 'var(--limitation-bg)' };
  return { border: 'var(--border)', color: 'var(--text-muted)', bg: 'transparent' };
}

const GATE_MARK: Record<GateState, string> = { pass: '✓', fix: '✗', missing: '·' };

/** Studio Menu - the lesson directory with a clear sample-vs-curriculum label. */
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
        Your lesson directory. Generate or regenerate a lesson&apos;s script; finished videos are reviewed via the Drive review bundle.
      </p>

      {lessons.length === 0 && (
        <p style={{ ...card, marginTop: '1rem', color: 'var(--text-muted)' }}>
          No lessons yet. Generate one from an outline to get started.
        </p>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lessons.map((l) => {
          const isSample = l.classification === 'sample';
          return (
            <div
              key={l.lessonId}
              style={{
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                borderColor: isSample ? 'var(--limitation-border)' : 'var(--border)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{l.title}</span>
                  <span
                    style={{
                      border: `1px solid ${isSample ? 'var(--limitation-border)' : 'var(--feature-border)'}`,
                      color: isSample ? 'var(--limitation-text)' : 'var(--feature-text)',
                      background: isSample ? 'var(--limitation-bg)' : 'var(--feature-bg)',
                      borderRadius: 999,
                      padding: '0.1rem 0.45rem',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                    }}
                  >
                    {l.classificationBadge}
                  </span>
                </div>
                {l.classificationNote && (
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--limitation-text)', fontWeight: 600 }}>
                    {l.classificationNote}
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {l.lessonId} - {l.scenes} scenes - {fmtDuration(l.durationSec)}
                  {l.hasVideo && <span> - video</span>}
                  {l.hasDraft && <span> - draft</span>}
                  {l.staleCount > 0 ? (
                    <span style={{ color: 'var(--limitation-text)' }}> - {l.staleCount} stale</span>
                  ) : (
                    <span> - up to date</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }} title="Definition of Done gates (A · B · C)">
                  {l.gates.map((g) => {
                    const c = gateColors(g.state);
                    return (
                      <span
                        key={g.gate}
                        title={`Gate ${g.gate} — ${g.label}: ${g.state}`}
                        style={{
                          border: `1px solid ${c.border}`,
                          color: c.color,
                          background: c.bg,
                          borderRadius: 'var(--radius)',
                          padding: '0.1rem 0.4rem',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                        }}
                      >
                        {GATE_MARK[g.state]} {g.gate} {g.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                {l.publishable ? (
                  <span
                    title="All three gates green — ready for manual Teachable upload"
                    style={{
                      border: '1px solid var(--feature-border)',
                      color: 'var(--feature-text)',
                      background: 'var(--feature-bg)',
                      borderRadius: 999,
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Ready to publish
                  </span>
                ) : (
                  <span
                    title="Publish blocked — Gates A·B·C must all pass first"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      borderRadius: 999,
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                    }}
                  >
                    Publish blocked
                  </span>
                )}
                <Link
                  href={`/studio/generate?lesson=${encodeURIComponent(l.lessonId)}`}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#fff',
                    background: 'var(--accent)',
                    borderRadius: 'var(--radius)',
                    padding: '0.35rem 0.7rem',
                  }}
                >
                  Generate
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
