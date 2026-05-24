'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Clip, ClipKind, LessonTimeline, Status } from '@/lib/studio-timeline';
import { Ruler, RULER_HEIGHT } from './Ruler';
import { Playhead } from './Playhead';
import { TrackLane, LANE, HEADER_WIDTH, TRACK_ORDER } from './TrackLane';
import { TransportBar } from './TransportBar';
import { Inspector, type Comment } from './Inspector';
import { StatusBadge } from './StatusBadge';

const DEFAULT_PX_PER_SEC = 16;

const worst = (a: Status, b: Status): Status =>
  a === 'error' || b === 'error' ? 'error' : a === 'stale' || b === 'stale' ? 'stale' : 'fresh';

const CLIP_PREFIX: Record<ClipKind, string> = {
  animation: 'anim-',
  voiceover: 'voice-',
  script: 'script-',
  captions: 'cap-',
};

/** Recover the scene id a clip belongs to from its prefixed clip id. */
function sceneIdOf(clip: Clip): string {
  let id = clip.id.slice(CLIP_PREFIX[clip.kind].length);
  if (clip.kind === 'captions') id = id.replace(/-\d+$/, ''); // strip caption page index
  return id;
}

/**
 * Studio orchestrator: owns the single shared time scale (pxPerSec), playhead,
 * selection, and comments. Renders the frozen header column + the one
 * horizontally-scrolling lane viewport (ruler + four lanes + playhead), the
 * transport footer, and the slide-in inspector.
 */
export function Timeline({
  lesson,
  lessons = [],
  regenEnabled = false,
}: {
  lesson: LessonTimeline;
  lessons?: string[];
  regenEnabled?: boolean;
}) {
  const router = useRouter();
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<Clip | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── playback: advance the playhead via requestAnimationFrame ──
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayheadSec((prev) => {
        const next = prev + dt;
        if (next >= lesson.durationSec) {
          setIsPlaying(false);
          return lesson.durationSec;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, lesson.durationSec]);

  // ── auto-scroll to keep the playhead in view during playback ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const x = playheadSec * pxPerSec;
    if (x < el.scrollLeft + 40 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
    }
  }, [playheadSec, pxPerSec]);

  const onSelect = useCallback((clip: Clip) => setSelected(clip), []);

  const setAiState = useCallback((clipId: string, commentId: string, aiState: Comment['aiState']) => {
    setComments((prev) => ({
      ...prev,
      [clipId]: (prev[clipId] ?? []).map((c) => (c.id === commentId ? { ...c, aiState } : c)),
    }));
  }, []);

  // A comment is direction for the AI. When regeneration is enabled on the host,
  // sending it kicks the lesson's regen DAG (CTRL-03) and the clip flips to
  // 'regenerating'. When it's disabled, the comment is just saved locally as a
  // note (no false "queued" state) — see the regeneration banner.
  const addComment = useCallback(
    (clip: Clip, body: string) => {
      const commentId = `${clip.id}-${Date.now()}`;
      setComments((prev) => ({
        ...prev,
        [clip.id]: [
          ...(prev[clip.id] ?? []),
          { id: commentId, author: 'You', createdAt: 'just now', body, aiState: regenEnabled ? 'queued' : undefined },
        ],
      }));

      if (!regenEnabled) return; // saved note only

      fetch('/api/regen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, sceneId: sceneIdOf(clip), comment: body }),
      })
        .then((res) => {
          if (res.ok) setAiState(clip.id, commentId, 'regenerating');
        })
        .catch(() => {
          /* leave as queued — surfaced as pending */
        });
    },
    [lesson.id, regenEnabled, setAiState],
  );

  const allClips: Clip[] = TRACK_ORDER.flatMap((k) => lesson.tracks[k]);
  const staleCount = allClips.filter((c) => c.status === 'stale').length;
  const errorCount = allClips.filter((c) => c.status === 'error').length;
  const innerWidth = lesson.durationSec * pxPerSec;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', background: 'var(--bg-base)', position: 'relative' }}>
      {/* header bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 48, padding: '0 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', fontFamily: 'var(--font)', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {lesson.title} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>— Studio</span>
          </h1>
          {lessons.length > 1 && (
            <select
              aria-label="Select lesson"
              value={lesson.id}
              onChange={(e) => router.push(`/studio?lesson=${encodeURIComponent(e.target.value)}`)}
              style={{
                fontFamily: 'var(--font)', fontSize: 13, padding: '4px 8px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                background: 'var(--bg-base)', color: 'var(--text)', cursor: 'pointer',
              }}
            >
              {lessons.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
        </div>
        <GlobalStatus stale={staleCount} error={errorCount} />
      </div>

      {/* body: frozen header column + scrolling lanes */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: HEADER_WIDTH, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ height: RULER_HEIGHT, borderBottom: '1px solid var(--border)' }} />
          {TRACK_ORDER.map((kind) => (
            <TrackHeader key={kind} kind={kind} aggregate={lesson.tracks[kind].reduce<Status>((s, c) => worst(s, c.status), 'fresh')} />
          ))}
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <div id="studio-lanes-inner" style={{ position: 'relative', width: innerWidth, minWidth: '100%' }}>
            <Ruler durationSec={lesson.durationSec} pxPerSec={pxPerSec} onSeek={setPlayheadSec} />
            {TRACK_ORDER.map((kind) => (
              <TrackLane
                key={kind}
                kind={kind}
                items={lesson.tracks[kind]}
                pxPerSec={pxPerSec}
                durationSec={lesson.durationSec}
                selectedId={selected?.id ?? null}
                playheadSec={playheadSec}
                onSelect={onSelect}
              />
            ))}
            <Playhead playheadSec={playheadSec} durationSec={lesson.durationSec} pxPerSec={pxPerSec} onScrub={setPlayheadSec} />
          </div>
        </div>
      </div>

      <TransportBar
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((p) => !p)}
        pxPerSec={pxPerSec}
        onZoom={setPxPerSec}
        playheadSec={playheadSec}
        durationSec={lesson.durationSec}
      />

      {selected && (
        <Inspector
          element={selected}
          comments={comments[selected.id] ?? []}
          regenEnabled={regenEnabled}
          onClose={() => setSelected(null)}
          onComment={(text) => addComment(selected, text)}
        />
      )}
    </div>
  );
}

function TrackHeader({ kind, aggregate }: { kind: ClipKind; aggregate: Status }) {
  return (
    <div
      style={{
        height: LANE[kind].height, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font)',
      }}
    >
      <span aria-hidden style={{ color: 'var(--accent)', fontSize: 13 }}>{LANE[kind].icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{LANE[kind].label}</span>
      <StatusBadge status={aggregate} size="sm" />
    </div>
  );
}

function GlobalStatus({ stale, error }: { stale: number; error: number }) {
  if (stale === 0 && error === 0) {
    return <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>all fresh</span>;
  }
  return (
    <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', gap: 10 }}>
      {stale > 0 && <span style={{ color: 'var(--limitation-text)' }}>↻ {stale} stale</span>}
      {error > 0 && <span style={{ color: 'var(--accent)' }}>! {error} error</span>}
    </span>
  );
}
