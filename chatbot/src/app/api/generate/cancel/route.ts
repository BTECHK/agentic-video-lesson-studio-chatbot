import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { RecordedStatus } from '@/lib/generation-status';
import { statusFilePath } from '../route';

/**
 * Cancel a decoupled Studio Generate job (#44): read the pid from the status
 * file, kill the background child (guarded if already dead), and mark the job
 * `canceled` so polling settles. No-ops cleanly when there is no live job.
 */
const LESSON_RE = /^[a-z0-9-]+$/;

interface StatusFile {
  status: RecordedStatus;
  pid?: number;
  startedAt?: string;
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

  const root = path.join(process.cwd(), '..');
  const statusFile = statusFilePath(root, lessonId);
  if (!existsSync(statusFile)) {
    return NextResponse.json({ status: 'canceled' });
  }

  let recorded: StatusFile | null = null;
  try {
    recorded = JSON.parse(readFileSync(statusFile, 'utf-8')) as StatusFile;
  } catch {
    recorded = null;
  }

  if (recorded?.pid) {
    try {
      process.kill(recorded.pid);
    } catch {
      // already dead — fine.
    }
  }

  writeFileSync(
    statusFile,
    `${JSON.stringify({ ...(recorded ?? {}), status: 'canceled' }, null, 2)}\n`,
    'utf-8',
  );

  return NextResponse.json({ status: 'canceled' });
}
