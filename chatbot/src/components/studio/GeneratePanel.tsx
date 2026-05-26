'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OutlineSummary } from '@/lib/generate-source';

interface FactCheck {
  ok: boolean;
  verifiedRefs: number;
  notes: { blockId: string; note: string }[];
  flags: { blockId: string; ref: string; reason: string }[];
}
interface Draft {
  blocks: { id: string; narration: string }[];
}

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--bg-card)',
  padding: '1rem 1.25rem',
};

export function GeneratePanel({
  outline,
  applyEnabled,
}: {
  outline: OutlineSummary;
  applyEnabled: boolean;
}) {
  const [phase, setPhase] = useState<'idle' | 'generating' | 'drafted' | 'applying'>(
    outline.hasDraft ? 'idle' : 'idle',
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [factCheck, setFactCheck] = useState<FactCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [canceled, setCanceled] = useState(false);
  // Poll handle for the status loop. The SERVER job runs independently of this
  // component — clearing the interval (e.g. on unmount) never stops generation.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Read the decoupled job's status once and reflect it in local state.
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/generate/status?lessonId=${encodeURIComponent(outline.lessonId)}`,
      );
      const json = await res.json().catch(() => ({}));
      if (json.status === 'done') {
        setDraft(json.draft);
        setFactCheck(json.factCheck);
        setPhase('drafted');
        setCanceled(false);
        stopPolling();
      } else if (json.status === 'error') {
        setError('Generation failed — check the server logs and try again.');
        setPhase('idle');
        stopPolling();
      } else if (json.status === 'canceled') {
        setCanceled(true);
        setPhase('idle');
        stopPolling();
      } else if (json.status === 'running') {
        setPhase('generating');
      }
      return json.status as string | undefined;
    } catch {
      return undefined;
    }
  }, [outline.lessonId, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void checkStatus();
    }, 3000);
  }, [checkStatus, stopPolling]);

  // On mount: resume. If a job is running, show progress + poll; if it already
  // finished, show the draft. This is what survives navigation.
  useEffect(() => {
    let active = true;
    void (async () => {
      const status = await checkStatus();
      if (active && status === 'running') startPolling();
    })();
    return () => {
      active = false;
      stopPolling();
    };
  }, [checkStatus, startPolling, stopPolling]);

  async function generate() {
    setPhase('generating');
    setError(null);
    setApplyMsg(null);
    setCanceled(false);
    try {
      // Fire-and-forget: POST returns immediately now (job runs in background).
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: outline.lessonId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.error || 'Generation failed');
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
      setPhase('idle');
    }
  }

  async function cancel() {
    stopPolling();
    try {
      await fetch('/api/generate/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: outline.lessonId }),
      });
    } catch {
      // best effort — the server kills the job by recorded pid.
    }
    setCanceled(true);
    setPhase('idle');
  }

  async function apply() {
    setPhase('applying');
    setApplyMsg(null);
    try {
      const res = await fetch('/api/generate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: outline.lessonId }),
      });
      const json = await res.json().catch(() => ({}));
      // 503 = rebuild gated (not an error); the route's message explains it.
      setApplyMsg(json.message || json.error || 'Done.');
    } catch {
      setApplyMsg("Couldn't reach the server — is the app still running?");
    } finally {
      setPhase('drafted');
    }
  }

  const hasFlags = (factCheck?.flags.length ?? 0) > 0;

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '1.5rem', fontFamily: 'var(--font)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Generate — {outline.title}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Draft a fact-checked script from this lesson&rsquo;s outline, review it, then apply to rebuild the video.
      </p>

      {/* What we generate from */}
      <section style={{ ...card, marginTop: '1rem' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-muted)', margin: 0 }}>
          Outline ({outline.sections.length} sections)
        </h2>
        <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
          {outline.sections.map((s, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <strong>{s.title}</strong> <span style={{ color: 'var(--text-muted)' }}>· {s.beats} beats</span>
              {s.objective && <div style={{ color: 'var(--text-muted)' }}>{s.objective}</div>}
            </li>
          ))}
        </ol>
      </section>

      <div style={{ marginTop: '1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={generate}
          disabled={phase === 'generating' || phase === 'applying'}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
            padding: '0.55rem 1rem', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem',
            cursor: phase === 'generating' ? 'default' : 'pointer', opacity: phase === 'generating' ? 0.6 : 1,
          }}
        >
          {phase === 'generating' ? 'Generating… (1–2 min)' : draft ? 'Regenerate script' : 'Generate script'}
        </button>
        {phase === 'generating' && (
          <>
            <button
              type="button"
              onClick={cancel}
              style={{
                background: 'var(--bg-base)', color: 'var(--accent)', border: '1px solid var(--accent)',
                borderRadius: 'var(--radius)', padding: '0.55rem 0.9rem', fontFamily: 'var(--font)',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Headless Claude is drafting the script from your outline…
            </span>
          </>
        )}
        {canceled && (
          <span role="status" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Generation canceled.
          </span>
        )}
      </div>

      {error && (
        <p role="alert" style={{ ...card, marginTop: '0.75rem', color: 'var(--accent)', fontSize: '0.8rem' }}>
          {error}
        </p>
      )}

      {/* Draft + fact-check */}
      {draft && factCheck && (
        <section style={{ ...card, marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Draft script</h2>
            <span
              style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius)',
                background: hasFlags ? 'rgba(139,38,53,0.12)' : 'rgba(46,125,50,0.12)',
                color: hasFlags ? 'var(--accent)' : '#2e7d32',
              }}
            >
              {hasFlags ? `${factCheck.flags.length} fact-check flag(s)` : `Fact-check passed · ${factCheck.verifiedRefs} refs`}
            </span>
          </div>

          {factCheck.flags.map((f, i) => (
            <p key={i} style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--accent)' }}>
              ⚠ [{f.blockId}] {f.ref}: {f.reason}
            </p>
          ))}

          <div style={{ marginTop: 10, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {draft.blocks.map((b) => (
              <div key={b.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{b.id}</div>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', lineHeight: 1.5 }}>{b.narration}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={apply}
              disabled={hasFlags || !applyEnabled || phase === 'applying'}
              title={
                hasFlags
                  ? 'Resolve fact-check flags before applying'
                  : applyEnabled
                    ? 'Apply this script and rebuild the video'
                    : 'Apply runs the render pipeline on the host (REGEN_TRIGGER_ENABLED)'
              }
              style={{
                background: hasFlags || !applyEnabled ? 'var(--bg-base)' : 'var(--accent)',
                color: hasFlags || !applyEnabled ? 'var(--text-muted)' : '#fff',
                border: hasFlags || !applyEnabled ? '1px solid var(--border)' : 'none',
                borderRadius: 'var(--radius)', padding: '0.5rem 0.9rem', fontFamily: 'var(--font)',
                fontWeight: 700, fontSize: '0.82rem',
                cursor: hasFlags || !applyEnabled || phase === 'applying' ? 'not-allowed' : 'pointer',
              }}
            >
              {phase === 'applying' ? 'Applying…' : 'Apply → rebuild video'}
            </button>
            {!applyEnabled && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Apply (render pipeline) is gated to the pipeline host.
              </span>
            )}
          </div>
          {applyMsg && <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text)' }}>{applyMsg}</p>}
        </section>
      )}
    </main>
  );
}
