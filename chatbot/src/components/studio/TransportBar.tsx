'use client';

import { formatTime } from '@/lib/studio-timeline';

export const MIN_PX_PER_SEC = 4;
export const MAX_PX_PER_SEC = 80;

/** Sticky footer: transport (play/pause + current time) centred, zoom left.
 *  Minimal chrome, Instagram-style. */
export function TransportBar({
  isPlaying,
  onPlayPause,
  pxPerSec,
  onZoom,
  playheadSec,
  durationSec,
}: {
  isPlaying: boolean;
  onPlayPause: () => void;
  pxPerSec: number;
  onZoom: (px: number) => void;
  playheadSec: number;
  durationSec: number;
}) {
  const clamp = (px: number) => Math.max(MIN_PX_PER_SEC, Math.min(MAX_PX_PER_SEC, px));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        height: 48,
        padding: '0 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        fontFamily: 'var(--font)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ZoomButton label="Zoom out" glyph="−" onClick={() => onZoom(clamp(pxPerSec - 6))} />
        <input
          type="range"
          aria-label="Zoom (pixels per second)"
          min={MIN_PX_PER_SEC}
          max={MAX_PX_PER_SEC}
          value={pxPerSec}
          onChange={(e) => onZoom(clamp(Number(e.target.value)))}
          style={{ width: 120, accentColor: 'var(--accent)' }}
        />
        <ZoomButton label="Zoom in" glyph="+" onClick={() => onZoom(clamp(pxPerSec + 6))} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto' }}>
        <button
          type="button"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
          {formatTime(playheadSec)} <span style={{ color: 'var(--text-muted)' }}>/ {formatTime(durationSec)}</span>
        </span>
      </div>

      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{pxPerSec} px/s</span>
    </div>
  );
}

function ZoomButton({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text)',
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {glyph}
    </button>
  );
}
