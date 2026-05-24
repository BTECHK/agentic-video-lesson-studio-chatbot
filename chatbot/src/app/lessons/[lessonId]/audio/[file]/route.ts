import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Serves a lesson's synthesized voiceover WAV to the Studio inspector's audio
 * player. The files live in the pipeline's content dir (../content/lessons/<id>/
 * audio), outside the chatbot's public/ — without this route the player 404s
 * while the clip shows "fresh". Both path segments are strictly validated to
 * prevent traversal before touching the filesystem.
 */
const LESSON_RE = /^[a-z0-9-]+$/;
const FILE_RE = /^scene-[a-z0-9-]+\.wav$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string; file: string }> },
) {
  const { lessonId, file } = await params;

  if (!LESSON_RE.test(lessonId) || !FILE_RE.test(file)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const abs = path.join(process.cwd(), '..', 'content', 'lessons', lessonId, 'audio', file);
  if (!existsSync(abs)) {
    return NextResponse.json({ error: 'Audio not generated' }, { status: 404 });
  }

  const buf = await readFile(abs);
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' },
  });
}
