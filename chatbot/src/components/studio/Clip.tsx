'use client';

import { useState } from 'react';
import {
  clipLeft,
  clipWidth,
  formatTime,
  type Clip as ClipData,
  type AnimationPayload,
  type ScriptPayload,
  type CaptionPayload,
} from '@/lib/studio-timeline';
import { StatusBadge } from './StatusBadge';

const KIND_LABEL: Record<ClipData['kind'], string> = {
  animation: 'Animation',
  voiceover: 'Voiceover',
  script: 'Narration',
  captions: 'Caption',
};

/** Left status accent: dashed edge = stale, solid bar = error, none = fresh. */
function statusEdge(status: ClipData['status']): React.CSSProperties {
  if (status === 'stale') return { borderLeft: '2px dashed var(--limitation-border)' };
  if (status === 'error') return { borderLeft: '3px solid var(--accent)' };
  return {};
}

/**
 * The universal timeline block — one renderer, four visual variants. A focusable
 * <button>: click/Enter selects it and opens the inspector. Position and size
 * come from the shared px-per-second scale so all lanes line up.
 */
export function Clip({
  clip,
  pxPerSec,
  selected,
  underPlayhead = false,
  onSelect,
}: {
  clip: ClipData;
  pxPerSec: number;
  selected: boolean;
  underPlayhead?: boolean;
  onSelect: (clip: ClipData) => void;
}) {
  const [hover, setHover] = useState(false);
  const width = clipWidth(clip.durationSec, pxPerSec);
  const label = `${KIND_LABEL[clip.kind]}, ${clip.label}, ${formatTime(clip.startSec)} to ${formatTime(
    clip.startSec + clip.durationSec,
  )}${clip.status !== 'fresh' ? `, ${clip.status}${clip.staleReason ? `: ${clip.staleReason}` : ''}` : ''}`;

  const shadow = selected
    ? '0 4px 14px rgba(28,28,28,0.16)'
    : hover
      ? '0 2px 8px rgba(28,28,28,0.1)'
      : 'none';

  return (
    <button
      type="button"
      onClick={() => onSelect(clip)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={label}
      aria-pressed={selected}
      title={clip.label}
      style={{
        position: 'absolute',
        left: clipLeft(clip.startSec, pxPerSec),
        top: 0,
        bottom: 0,
        width,
        margin: 0,
        padding: clip.kind === 'captions' ? '0 4px' : '6px 8px',
        textAlign: 'left',
        cursor: 'pointer',
        overflow: 'hidden',
        font: 'inherit',
        fontFamily: 'var(--font)',
        background: underPlayhead && !selected ? 'var(--accent-soft)' : 'var(--bg-card)',
        color: 'var(--text)',
        borderRadius: 'var(--radius)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: shadow,
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        ...statusEdge(clip.status),
      }}
    >
      <ClipBody clip={clip} compact={width < 64} />
      {clip.status !== 'fresh' && (
        <span style={{ position: 'absolute', top: 4, right: 4 }}>
          <StatusBadge status={clip.status} size="sm" />
        </span>
      )}
    </button>
  );
}

function ClipBody({ clip, compact }: { clip: ClipData; compact: boolean }) {
  if (clip.kind === 'voiceover') return <Waveform />;

  if (clip.kind === 'animation') {
    const p = clip.payload as AnimationPayload;
    return (
      <>
        <ThumbStrip />
        {!compact && <span style={labelStyle}>{p.label}</span>}
      </>
    );
  }

  if (clip.kind === 'script') {
    const p = clip.payload as ScriptPayload;
    return <span style={{ ...clampStyle, WebkitLineClamp: 2 }}>{p.text}</span>;
  }

  const p = clip.payload as CaptionPayload; // captions
  return <span style={{ ...clampStyle, WebkitLineClamp: 1, fontSize: 11, alignSelf: 'center' }}>{p.text}</span>;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const clampStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.35,
  color: 'var(--text)',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

/** Placeholder filmstrip — a calm tonal band standing in for scene thumbnails
 *  until first-frame stills are wired (renders cheaply, on-brand). */
function ThumbStrip() {
  return (
    <span
      aria-hidden
      style={{
        flex: 1,
        minHeight: 18,
        borderRadius: 2,
        background:
          'repeating-linear-gradient(90deg, var(--accent-soft) 0 14px, transparent 14px 28px), var(--bg-alt)',
        opacity: 0.9,
      }}
    />
  );
}

/** Lightweight CSS waveform motif for the lane (real wavesurfer peaks land in a
 *  follow-up; full audio plays in the inspector). */
function Waveform() {
  return (
    <span aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', opacity: 0.55 }}>
      {WAVE_BARS.map((h, i) => (
        <span
          key={i}
          style={{ flex: 1, height: `${h}%`, minWidth: 1, background: 'var(--accent)', borderRadius: 1 }}
        />
      ))}
    </span>
  );
}

// A fixed pseudo-random bar pattern — deterministic so SSR and client match.
const WAVE_BARS = [22, 48, 70, 40, 88, 56, 30, 64, 92, 44, 26, 60, 80, 38, 54, 72, 34, 66, 46, 28, 58, 84, 42, 68];
