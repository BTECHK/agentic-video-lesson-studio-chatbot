import { NextRequest, NextResponse } from 'next/server';
import { loadEdits, addStagedEdit, updateEditStatus } from '@/lib/edits-store';
import { requireOperator } from '@/lib/operator-auth';

/** Staged content edits API (narration text). Persists to .edits.json per lesson. */
const LESSON_RE = /^[a-z0-9-]+$/;

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lessonId') ?? '';
  if (!LESSON_RE.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
  }
  return NextResponse.json({ edits: loadEdits(lessonId) });
}

export async function POST(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { lessonId, sceneId, field, value } = (body ?? {}) as Record<string, string>;
  const validField = field === 'narration' || field === 'order';
  // narration edits target a scene; order edits carry the full scene-id list in value.
  if (!lessonId || !LESSON_RE.test(lessonId) || !validField || !value?.trim() || (field === 'narration' && !sceneId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const edit = addStagedEdit(lessonId, { sceneId: sceneId ?? '', field, value: value.trim() });
  return NextResponse.json({ edit });
}

export async function PATCH(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;

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
  const ok = updateEditStatus(lessonId, id, status as 'open' | 'applied' | 'dismissed');
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
