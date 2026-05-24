'use client';

import { useState } from 'react';
import type { IngestionPanelData, VendorRow } from '@/lib/ingestion-panel';
import type { FreshnessLevel } from '@/lib/ingestion-status';

const DOT: Record<FreshnessLevel, string> = {
  fresh: '#2e7d32',
  aging: '#b88600',
  stale: '#8B2635',
};
const FRESH_LABEL: Record<FreshnessLevel, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  stale: 'Stale',
};

function fmtDate(iso?: string): string {
  if (!iso) return 'never';
  return iso.slice(0, 10);
}

function relDays(iso: string | undefined, nowIso: string): string {
  if (!iso) return '';
  const days = Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  return `${days}d ago`;
}

export function IngestionPanel({
  data,
  triggerEnabled,
}: {
  data: IngestionPanelData;
  triggerEnabled: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function trigger(label: string, body: { mode: 'poll' | 'search'; vendor?: string }) {
    setPending(label);
    setStatus(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setStatus(
        json.status === 'queued'
          ? `Queued: ingest ${json.args.join(' ')}`
          : json.message || json.error || 'Could not trigger ingestion.',
      );
    } catch {
      setStatus('Network error triggering ingestion.');
    } finally {
      setPending(null);
    }
  }

  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--bg-card)',
    padding: '1rem 1.25rem',
  };

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '1.5rem', fontFamily: 'var(--font)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Ingestion Control Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Data freshness across vendor sources · schedule {data.schedule.frequency}{' '}
            ({data.schedule.dayOfWeek} {data.schedule.timeOfDay})
          </p>
        </div>
        <button
          type="button"
          disabled={pending !== null || !triggerEnabled}
          title={triggerEnabled ? 'Run a poll for all vendors' : 'Triggering is disabled in this environment'}
          onClick={() => trigger('all', { mode: 'poll' })}
          style={{
            background: triggerEnabled ? 'var(--accent)' : 'var(--bg-base)',
            color: triggerEnabled ? '#fff' : 'var(--text-muted)',
            border: triggerEnabled ? 'none' : '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.5rem 0.9rem',
            fontFamily: 'var(--font)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: !triggerEnabled || pending ? 'not-allowed' : 'pointer',
            opacity: pending === 'all' ? 0.6 : 1,
          }}
        >
          {pending === 'all' ? 'Triggering…' : 'Refresh all'}
        </button>
      </div>

      {!triggerEnabled && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-base)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.5rem 0.75rem',
          }}
        >
          Read-only view. Manual refresh is disabled in this environment — it runs the real scraping
          pipeline (and can open PRs), so it&rsquo;s gated to the pipeline host
          (<code>INGEST_TRIGGER_ENABLED=true</code>). Freshness below reflects the last actual run.
        </p>
      )}

      {status && (
        <p
          role="status"
          style={{
            marginTop: '0.75rem',
            fontSize: '0.78rem',
            color: 'var(--text)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.5rem 0.75rem',
          }}
        >
          {status}
        </p>
      )}

      {/* Schedule + last run */}
      <section style={{ ...card, marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <Stat label="Last run" value={data.latestRun ? `${fmtDate(data.latestRun.at)} (${data.latestRun.mode})` : 'never'} />
        <Stat label="Next scheduled" value={fmtDate(data.nextRun ?? undefined)} />
        <Stat label="Changes (last run)" value={data.latestRun ? String(data.latestRun.changesFound) : '—'} />
        <Stat label="Errors (last run)" value={data.latestRun ? String(data.latestRun.errors) : '—'} />
      </section>

      {/* Per-vendor freshness */}
      <section style={{ ...card, marginTop: '1rem', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={th}>Vendor</th>
              <th style={th}>Status</th>
              <th style={th}>Last refreshed</th>
              <th style={{ ...th, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.vendors.map((v: VendorRow) => (
              <tr key={v.vendor} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={td}>
                  {v.vendor}
                  {!v.enabled && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>(disabled)</span>}
                </td>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOT[v.freshness] }} />
                    {FRESH_LABEL[v.freshness]}
                  </span>
                </td>
                <td style={{ ...td, color: 'var(--text-muted)' }}>
                  {fmtDate(v.lastRun)} {v.lastRun && <span>· {relDays(v.lastRun, data.generatedAt)}</span>}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button
                    type="button"
                    disabled={pending !== null || !v.enabled || !triggerEnabled}
                    title={triggerEnabled ? `Poll ${v.vendor}` : 'Triggering is disabled in this environment'}
                    onClick={() => trigger(v.vendor, { mode: 'poll', vendor: v.vendor })}
                    style={{
                      background: 'transparent',
                      color: triggerEnabled ? 'var(--accent)' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '0.3rem 0.6rem',
                      fontFamily: 'var(--font)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: pending || !v.enabled || !triggerEnabled ? 'not-allowed' : 'pointer',
                      opacity: pending === v.vendor ? 0.6 : 1,
                    }}
                  >
                    {pending === v.vendor ? '…' : 'Refresh'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Ad hoc topic search is not yet a pipeline capability — refresh pulls from each vendor&rsquo;s
        established sources. Triggering requires the pipeline host (INGEST_TRIGGER_ENABLED).
      </p>
    </main>
  );
}

const th: React.CSSProperties = { padding: '0.6rem 1rem', fontWeight: 600 };
const td: React.CSSProperties = { padding: '0.6rem 1rem' };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
