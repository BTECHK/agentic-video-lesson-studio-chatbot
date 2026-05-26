'use client';

import type { Clip as ClipData, ClipKind } from '@/lib/studio-timeline';
import { Clip } from './Clip';

export const HEADER_WIDTH = 200;

export const LANE: Record<ClipKind, { height: number; icon: string; label: string }> = {
  animation: { height: 72, icon: '◆', label: 'Animation' },
  voiceover: { height: 64, icon: '♪', label: 'Voiceover' },
  // The narration text IS the caption source (same words; captions only add
  // per-word timing, which is audio-derived). The authoring view shows one
  // Narration row; the timed-caption breakdown stays in the inspector.
  script: { height: 64, icon: '¶', label: 'Narration' },
  captions: { height: 48, icon: '▭', label: 'Captions' },
};

export const TRACK_ORDER: ClipKind[] = ['animation', 'voiceover', 'script'];

/** One horizontal track: a positioned row of clips on the shared time scale.
 *  Clips whose span contains the playhead get a faint wash so alignment reads. */
export function TrackLane({
  kind,
  items,
  pxPerSec,
  durationSec,
  selectedId,
  playheadSec,
  onSelect,
}: {
  kind: ClipKind;
  items: ClipData[];
  pxPerSec: number;
  durationSec: number;
  selectedId: string | null;
  playheadSec: number;
  onSelect: (clip: ClipData) => void;
}) {
  return (
    <div
      role="row"
      aria-label={`${LANE[kind].label} track`}
      style={{
        position: 'relative',
        height: LANE[kind].height,
        width: durationSec * pxPerSec,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-alt)',
      }}
    >
      {items.map((clip) => (
        <Clip
          key={clip.id}
          clip={clip}
          pxPerSec={pxPerSec}
          selected={selectedId === clip.id}
          underPlayhead={playheadSec >= clip.startSec && playheadSec < clip.startSec + clip.durationSec}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
