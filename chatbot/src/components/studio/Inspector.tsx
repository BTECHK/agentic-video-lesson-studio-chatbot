'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatTime,
  type Clip,
  type ScriptPayload,
  type CaptionPayload,
  type VoicePayload,
  type AnimationPayload,
} from '@/lib/studio-timeline';
import { StatusBadge } from './StatusBadge';

export interface Comment {
  id: string;
  author: string;
  createdAt: string;
  body: string;
  aiState?: 'queued' | 'regenerating' | 'done';
}

const KIND_TITLE: Record<Clip['kind'], string> = {
  animation: 'Animation',
  voiceover: 'Voiceover',
  script: 'Script',
  captions: 'Caption',
};

const STATUS_LINE: Record<Clip['status'], string> = {
  fresh: 'Up to date',
  stale: 'Stale — upstream input changed',
  error: 'Generation failed',
};

/**
 * Right-overlay inspector (380px): the selected element in isolation, its status,
 * and a comment thread. Commenting is the ONLY mutation the control plane makes —
 * downstream AI regeneration reflects back via each comment's aiState. Modal
 * dialog: Esc closes, focus returns to the originating clip.
 */
export function Inspector({
  element,
  comments,
  regenEnabled = false,
  stagedEditCount = 0,
  onClose,
  onComment,
  onStageEdit,
}: {
  element: Clip;
  comments: Comment[];
  regenEnabled?: boolean;
  stagedEditCount?: number;
  onClose: () => void;
  onComment: (text: string) => void;
  onStageEdit?: (value: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onComment(text);
    setDraft('');
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,28,28,0.18)', zIndex: 30 }}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${KIND_TITLE[element.kind]} inspector`}
        className="studio-inspector"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          zIndex: 31,
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 24px rgba(28,28,28,0.12)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {KIND_TITLE[element.kind]} · {element.label}
          </h2>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Close inspector"
            style={{
              width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              background: 'var(--bg-base)', cursor: 'pointer', fontSize: 14, color: 'var(--text)',
            }}
          >
            ✕
          </button>
        </header>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <Preview element={element} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <StatusBadge status={element.status} />
            <span style={{ color: element.status === 'fresh' ? 'var(--text-muted)' : 'var(--text)' }}>
              {element.staleReason ?? STATUS_LINE[element.status]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {formatTime(element.startSec)} – {formatTime(element.startSec + element.durationSec)} · {element.label}
          </div>

          {element.kind === 'script' && onStageEdit && (
            <NarrationEditor
              initial={(element.payload as ScriptPayload).text}
              stagedEditCount={stagedEditCount}
              onStage={onStageEdit}
            />
          )}

          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '4px 0' }} />

          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Comments
          </h3>
          {comments.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              No comments yet. Leave direction for the AI to regenerate this element.
            </p>
          )}
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder="Leave a comment for the AI…"
              rows={3}
              style={{
                resize: 'vertical', padding: 8, fontFamily: 'var(--font)', fontSize: 13,
                border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-base)',
                color: 'var(--text)',
              }}
            />
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              {regenEnabled
                ? 'Sending kicks a regeneration of this lesson on the pipeline host.'
                : 'Saved as a note on this element (local). Regeneration is disabled in this environment.'}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              style={{
                alignSelf: 'flex-end', padding: '6px 16px', borderRadius: 'var(--radius)', border: 'none',
                background: draft.trim() ? 'var(--accent)' : 'var(--accent-soft)',
                color: draft.trim() ? '#fff' : 'var(--accent)',
                fontWeight: 600, fontSize: 13, cursor: draft.trim() ? 'pointer' : 'default', fontFamily: 'var(--font)',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function NarrationEditor({
  initial,
  stagedEditCount,
  onStage,
}: {
  initial: string;
  stagedEditCount: number;
  onStage: (value: string) => void;
}) {
  const [text, setText] = useState(initial);
  const dirty = text.trim() !== initial.trim() && text.trim().length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Narration (editable)
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        style={{
          resize: 'vertical', padding: 8, fontFamily: 'var(--font)', fontSize: 13, lineHeight: 1.5,
          border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-base)', color: 'var(--text)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => onStage(text.trim())}
          disabled={!dirty}
          style={{
            padding: '5px 12px', borderRadius: 'var(--radius)', border: 'none',
            background: dirty ? 'var(--accent)' : 'var(--accent-soft)', color: dirty ? '#fff' : 'var(--accent)',
            fontWeight: 600, fontSize: 12, cursor: dirty ? 'pointer' : 'default', fontFamily: 'var(--font)',
          }}
        >
          Stage edit
        </button>
        {stagedEditCount > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {stagedEditCount} staged edit{stagedEditCount === 1 ? '' : 's'} on this scene
          </span>
        )}
      </div>
    </div>
  );
}

function Preview({ element }: { element: Clip }) {
  const box: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-base)',
    padding: 14, minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center',
  };

  if (element.kind === 'script') {
    return <div style={box}><p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{(element.payload as ScriptPayload).text}</p></div>;
  }
  if (element.kind === 'captions') {
    return <div style={{ ...box, alignItems: 'center', textAlign: 'center' }}><p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{(element.payload as CaptionPayload).text}</p></div>;
  }
  if (element.kind === 'voiceover') {
    const src = (element.payload as VoicePayload).audioSrc;
    return (
      <div style={box}>
        {src ? (
          <audio controls src={`/${src.replace(/^\/+/, '')}`} style={{ width: '100%' }} />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Audio not generated yet — run the voiceover step.</p>
        )}
      </div>
    );
  }
  const p = element.payload as AnimationPayload;
  return (
    <div style={{ ...box, alignItems: 'center', textAlign: 'center', gap: 6 }}>
      <span style={{ fontSize: 24 }} aria-hidden>◆</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Scene type: <strong style={{ color: 'var(--text)' }}>{p.sceneType}</strong></p>
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const AI_LABEL: Record<NonNullable<Comment['aiState']>, string> = {
    queued: '↳ AI: queued…',
    regenerating: '↳ AI: regenerating…',
    done: '↳ AI: regenerated',
  };
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, background: 'var(--bg-base)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
        {comment.author} · {comment.createdAt}
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{comment.body}</p>
      {comment.aiState && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{AI_LABEL[comment.aiState]}</div>
      )}
    </div>
  );
}
