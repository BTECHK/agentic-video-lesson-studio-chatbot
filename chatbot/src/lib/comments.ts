/**
 * Staged comments for the Studio control plane. A comment is durable, metadata-
 * tagged direction on a specific clip (lesson/scene/track) that accumulates in a
 * staging area until applied. Pure helpers here; the file-backed store is in
 * comments-store.ts.
 */

export type CommentStatus = 'open' | 'applied' | 'dismissed';

export interface StagedComment {
  id: string;
  clipId: string;
  kind: string; // animation | voiceover | script | captions
  sceneId: string;
  body: string;
  author: string;
  createdAt: string;
  status: CommentStatus;
}

export interface NewComment {
  clipId: string;
  kind: string;
  sceneId: string;
  body: string;
  author?: string;
}

/** Build a staged comment, stamping id/time/metadata; new comments start open. */
export function makeComment(input: NewComment, opts: { id: string; now: string }): StagedComment {
  return {
    id: opts.id,
    clipId: input.clipId,
    kind: input.kind,
    sceneId: input.sceneId,
    body: input.body,
    author: input.author ?? 'You',
    createdAt: opts.now,
    status: 'open',
  };
}

export function commentsForClip(list: StagedComment[], clipId: string): StagedComment[] {
  return list.filter((c) => c.clipId === clipId);
}

/** Count of comments still awaiting action (the staging-area badge). */
export function pendingCount(list: StagedComment[]): number {
  return list.filter((c) => c.status === 'open').length;
}

export function setStatus(list: StagedComment[], id: string, status: CommentStatus): StagedComment[] {
  return list.map((c) => (c.id === id ? { ...c, status } : c));
}
