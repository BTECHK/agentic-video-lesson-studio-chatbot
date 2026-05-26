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
import type { StagedComment } from '@/lib/comments';
import { openEdits, editsForScene, type StagedEdit } from '@/lib/edits';

/** Map a persisted staged comment to the inspector's view shape. */
function toViewComment(c: StagedComment): Comment {
  return { id: c.id, author: c.author, createdAt: c.createdAt.slice(0, 16).replace('T', ' '), body: c.body };
}

/** Group a flat staged-comment list into the per-clip record the timeline holds. */
function groupByClip(list: StagedComment[]): Record<string, Comment[]> {
  const out: Record<string, Comment[]> = {};
  for (const c of list) (out[c.clipId] ??= []).push(toViewComment(c));
  return out;
}

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
  initialComments = [],
  initialEdits = [],
}: {
  lesson: LessonTimeline;
  lessons?: string[];
  regenEnabled?: boolean;
  initialComments?: StagedComment[];
  initialEdits?: StagedEdit[];
}) {
  const router = useRouter();
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<Clip | null>(null);
  // Seeded from persisted comments so they survive refresh (no longer ephemeral).
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => groupByClip(initialComments));
  const [edits, setEdits] = useState<StagedEdit[]>(initialEdits);
  const [editMsg, setEditMsg] = useState<string | null>(null);

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

  // A comment is durable, metadata-tagged direction on a clip. It's PERSISTED to
  // the staging store (survives refresh), then — if regeneration is enabled on the
  // host — kicks the lesson's regen DAG (CTRL-03) and the clip flips to
  // 'regenerating'. When regen is disabled it's a saved note (no false "queued").
  const addComment = useCallback(
    (clip: Clip, body: string) => {
      const sceneId = sceneIdOf(clip);
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, clipId: clip.id, kind: clip.kind, sceneId, body }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('persist failed'))))
        .then(({ comment }: { comment: StagedComment }) => {
          const view: Comment = { ...toViewComment(comment), aiState: regenEnabled ? 'queued' : undefined };
          setComments((prev) => ({ ...prev, [clip.id]: [...(prev[clip.id] ?? []), view] }));

          if (!regenEnabled) return; // saved note only
          fetch('/api/regen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId: lesson.id, sceneId, comment: body }),
          })
            .then((res) => {
              if (res.ok) setAiState(clip.id, comment.id, 'regenerating');
            })
            .catch(() => {
              /* leave as queued — surfaced as pending */
            });
        })
        .catch(() => {
          /* persistence failed — surfaced by the comment not appearing */
        });
    },
    [lesson.id, regenEnabled, setAiState],
  );

  const pendingComments = Object.values(comments).flat().length;
  const pendingEdits = openEdits(edits).length;

  // Stage a narration edit for a clip's scene (persists; applied later in a batch).
  const stageEdit = useCallback(
    (clip: Clip, value: string) => {
      fetch('/api/edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, sceneId: sceneIdOf(clip), field: 'narration', value }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('stage failed'))))
        .then(({ edit }: { edit: StagedEdit }) => {
          setEdits((prev) => [...prev, edit]);
          setEditMsg('Edit staged. Apply to rebuild the video.');
        })
        .catch(() => setEditMsg('Could not stage edit.'));
    },
    [lesson.id],
  );

  // Apply all staged edits → writes script.json + regenerates (host-gated route).
  const applyEdits = useCallback(() => {
    setEditMsg('Applying…');
    fetch('/api/edits/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id }),
    })
      .then((res) => res.json())
      .then((j) => {
        setEditMsg(j.message || j.error || 'Done.');
        if (j.status === 'applying') {
          setEdits((prev) => prev.map((e) => (e.status === 'open' ? { ...e, status: 'applied' as const } : e)));
        }
      })
      .catch(() => setEditMsg('Network error applying edits.'));
  }, [lesson.id]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {pendingComments > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
              ✎ {pendingComments} note{pendingComments === 1 ? '' : 's'}
            </span>
          )}
          {pendingEdits > 0 && (
            <button
              type="button"
              onClick={applyEdits}
              title={regenEnabled ? 'Write edits to the script and rebuild the video' : 'Applying edits rebuilds on the pipeline host'}
              style={{
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
                color: '#fff', background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--radius)', padding: '5px 12px', cursor: 'pointer',
              }}
            >
              Apply {pendingEdits} edit{pendingEdits === 1 ? '' : 's'} → rebuild
            </button>
          )}
          <GlobalStatus stale={staleCount} error={errorCount} />
        </div>
      </div>
      {editMsg && (
        <div style={{ padding: '6px 16px', fontSize: '0.78rem', color: 'var(--text)', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
          {editMsg}
        </div>
      )}

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
          stagedEditCount={openEdits(editsForScene(edits, sceneIdOf(selected))).length}
          onClose={() => setSelected(null)}
          onComment={(text) => addComment(selected, text)}
          onStageEdit={(value) => stageEdit(selected, value)}
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
