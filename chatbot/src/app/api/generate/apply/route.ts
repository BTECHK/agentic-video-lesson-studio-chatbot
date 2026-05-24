import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Apply a reviewed script draft: promote script.draft.json → script.json, then
 * chain the full pipeline to the MP4 via the regeneration DAG (plan → TTS → align
 * → render). Because that runs Docker + Remotion, Apply is gated to the pipeline
 * host (REGEN_TRIGGER_ENABLED=true); elsewhere it returns 503 WITHOUT promoting
 * the draft, so a lesson is never left half-applied (new script, stale video).
 */
const LESSON_RE = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { lessonId } = (body ?? {}) as { lessonId?: string };
  if (!lessonId || !LESSON_RE.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
  }

  const root = path.join(process.cwd(), '..');
  const dir = path.join(root, 'content', 'lessons', lessonId);
  const draftPath = path.join(dir, 'script.draft.json');
  if (!existsSync(draftPath)) {
    return NextResponse.json({ error: 'No draft to apply — generate first' }, { status: 404 });
  }

  if (process.env.REGEN_TRIGGER_ENABLED !== 'true') {
    return NextResponse.json(
      {
        status: 'disabled',
        message:
          'Apply chains the full render pipeline (Docker + Remotion) and runs on the pipeline host (REGEN_TRIGGER_ENABLED=true). Draft left untouched.',
      },
      { status: 503 },
    );
  }

  // Promote the reviewed draft, then kick the regeneration DAG to rebuild to MP4.
  await copyFile(draftPath, path.join(dir, 'script.json'));
  const child = spawn('npx', ['tsx', 'scripts/regenerate.ts', lessonId], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  child.unref();

  return NextResponse.json({ status: 'applying', message: 'Script applied; rebuilding video in the background.' });
}
