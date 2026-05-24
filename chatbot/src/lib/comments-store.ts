import 'server-only';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { makeComment, setStatus, type StagedComment, type NewComment, type CommentStatus } from './comments';

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');
const fileFor = (lessonId: string) => path.join(LESSONS_DIR, lessonId, '.comments.json');

/** Load a lesson's staged comments (durable across refresh/restart). */
export function loadComments(lessonId: string): StagedComment[] {
  const f = fileFor(lessonId);
  if (!existsSync(f)) return [];
  try {
    return JSON.parse(readFileSync(f, 'utf-8')) as StagedComment[];
  } catch {
    return [];
  }
}

function write(lessonId: string, list: StagedComment[]): void {
  const dir = path.join(LESSONS_DIR, lessonId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fileFor(lessonId), `${JSON.stringify(list, null, 2)}\n`, 'utf-8');
}

/** Append a new staged comment and persist; returns the created comment. */
export function addStagedComment(lessonId: string, input: NewComment): StagedComment {
  const comment = makeComment(input, { id: crypto.randomUUID(), now: new Date().toISOString() });
  write(lessonId, [...loadComments(lessonId), comment]);
  return comment;
}

/** Update a comment's status (applied/dismissed); returns whether it was found. */
export function updateCommentStatus(lessonId: string, id: string, status: CommentStatus): boolean {
  const list = loadComments(lessonId);
  if (!list.some((c) => c.id === id)) return false;
  write(lessonId, setStatus(list, id, status));
  return true;
}
