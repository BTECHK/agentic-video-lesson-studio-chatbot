'use client';

import { useCallback, useEffect, useRef } from 'react';
import { formatTime } from '@/lib/studio-timeline';

/**
 * The cursor for the whole lane stack: a 2px accent line spanning every lane,
 * with a draggable ▼ handle sitting in the ruler. Acts as an ARIA slider —
 * arrow keys nudge, Home/End jump. Instant during drag; the caller decides
 * whether programmatic jumps are spring-eased (honoring reduced-motion).
 */
export function Playhead({
  playheadSec,
  durationSec,
  pxPerSec,
  onScrub,
}: {
  playheadSec: number;
  durationSec: number;
  pxPerSec: number;
  onScrub: (sec: number) => void;
}) {
  const draggingRef = useRef(false);
  const left = playheadSec * pxPerSec;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const lane = document.getElementById('studio-lanes-inner');
      if (!lane) return;
      const rect = lane.getBoundingClientRect();
      onScrub(Math.max(0, Math.min(durationSec, (e.clientX - rect.left) / pxPerSec)));
    },
    [durationSec, pxPerSec, onScrub],
  );

  useEffect(() => {
    const up = () => (draggingRef.current = false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', up);
    };
  }, [onPointerMove]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? durationSec : playheadSec + map[e.key] * step;
    onScrub(Math.max(0, Math.min(durationSec, next)));
  };

  return (
    <div style={{ position: 'absolute', left, top: 0, bottom: 0, width: 0, zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: -1, width: 2, background: 'var(--accent)' }} />
      <button
        type="button"
        role="slider"
        aria-label="Playhead"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationSec)}
        aria-valuenow={Math.round(playheadSec)}
        aria-valuetext={`${formatTime(playheadSec)} of ${formatTime(durationSec)}`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        style={{
          position: 'absolute',
          top: -2,
          left: -8,
          width: 16,
          height: 16,
          padding: 0,
          cursor: 'ew-resize',
          pointerEvents: 'auto',
          background: 'var(--accent)',
          border: 'none',
          color: '#fff',
          fontSize: 9,
          lineHeight: '16px',
          borderRadius: '0 0 var(--radius) var(--radius)',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}
      />
    </div>
  );
}
