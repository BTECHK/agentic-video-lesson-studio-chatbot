import { NextRequest, NextResponse } from 'next/server';
import { loadComments, addStagedComment, updateCommentStatus } from '@/lib/comments-store';

/**
 * Staged comments API. Comments persist to content/lessons/<id>/.comments.json so
 * they survive refresh/restart (the prior version lost them — React state only).
 */
const LESSON_RE = /^[a-z0-9-]+$/;

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lessonId') ?? '';
  if (!LESSON_RE.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
  }
  return NextResponse.json({ comments: loadComments(lessonId) });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { lessonId, clipId, kind, sceneId, body: text, author } = (body ?? {}) as Record<string, string>;
  if (!lessonId || !LESSON_RE.test(lessonId) || !clipId || !kind || !sceneId || !text?.trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const comment = addStagedComment(lessonId, { clipId, kind, sceneId, body: text.trim(), author });
  return NextResponse.json({ comment });
}

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { lessonId, id, status } = (body ?? {}) as Record<string, string>;
  if (!lessonId || !LESSON_RE.test(lessonId) || !id || !['open', 'applied', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const ok = updateCommentStatus(lessonId, id, status as 'open' | 'applied' | 'dismissed');
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
