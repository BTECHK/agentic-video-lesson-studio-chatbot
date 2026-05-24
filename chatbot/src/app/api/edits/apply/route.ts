import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadEdits, markOpenEditsApplied } from '@/lib/edits-store';
import { applyNarrationEdits, openEdits } from '@/lib/edits';

/**
 * Apply staged narration edits: write them into script.json (the source the
 * pipeline reads) and regenerate to MP4 (per-scene TTS cache means only edited
 * scenes re-synthesize). Gated to the pipeline host (REGEN_TRIGGER_ENABLED);
 * elsewhere returns 503 WITHOUT writing, so source/video never diverge.
 */
const LESSON_RE = /^[a-z0-9-]+$/;

interface ScriptDoc {
  blocks: { id: string; narration: string }[];
  [key: string]: unknown;
}

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

  const open = openEdits(loadEdits(lessonId));
  if (open.length === 0) {
    return NextResponse.json({ error: 'No staged edits to apply' }, { status: 404 });
  }

  if (process.env.REGEN_TRIGGER_ENABLED !== 'true') {
    return NextResponse.json(
      {
        status: 'disabled',
        message:
          'Applying edits rebuilds the video (Docker + Remotion) and runs on the pipeline host (REGEN_TRIGGER_ENABLED=true). Edits remain staged.',
      },
      { status: 503 },
    );
  }

  const root = path.join(process.cwd(), '..');
  const scriptPath = path.join(root, 'content', 'lessons', lessonId, 'script.json');
  if (!existsSync(scriptPath)) {
    return NextResponse.json({ error: 'Lesson has no script.json' }, { status: 404 });
  }

  const script = JSON.parse(readFileSync(scriptPath, 'utf-8')) as ScriptDoc;
  script.blocks = applyNarrationEdits(script.blocks, open);
  writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf-8');
  markOpenEditsApplied(lessonId);

  const child = spawn('npx', ['tsx', 'scripts/regenerate.ts', lessonId], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  child.unref();

  return NextResponse.json({
    status: 'applying',
    applied: open.length,
    message: `${open.length} edit(s) written to script.json; rebuilding video in the background.`,
  });
}
