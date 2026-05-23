'use client';

import { tickIntervalSec, formatTime } from '@/lib/studio-timeline';

const RULER_HEIGHT = 28;

/**
 * Shared time axis. Tick marks + mm:ss labels at adaptive intervals; click
 * anywhere to seek. This is the primary scrub surface — the playhead line is
 * drawn over the whole lane stack separately.
 */
export function Ruler({
  durationSec,
  pxPerSec,
  onSeek,
}: {
  durationSec: number;
  pxPerSec: number;
  onSeek: (sec: number) => void;
}) {
  const interval = tickIntervalSec(pxPerSec);
  const ticks: number[] = [];
  for (let t = 0; t <= durationSec + 0.001; t += interval) ticks.push(t);

  const seekFromEvent = (clientX: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(durationSec, (clientX - rect.left) / pxPerSec)));
  };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => seekFromEvent(e.clientX, e.currentTarget)}
      style={{
        position: 'relative',
        height: RULER_HEIGHT,
        width: durationSec * pxPerSec,
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        userSelect: 'none',
      }}
    >
      {ticks.map((t) => (
        <div key={t} style={{ position: 'absolute', left: t * pxPerSec, top: 0, bottom: 0 }}>
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: 8, background: 'var(--border)' }} />
          <span
            style={{
              position: 'absolute',
              left: 4,
              top: 5,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
            }}
          >
            {formatTime(t)}
          </span>
        </div>
      ))}
    </div>
  );
}

export { RULER_HEIGHT };
