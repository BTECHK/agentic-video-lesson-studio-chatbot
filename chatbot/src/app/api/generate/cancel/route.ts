import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { isTerminalStatus, statusFilePath, type RecordedStatus } from '@/lib/generation-status';
import { logEvent } from '@/lib/log';
import { requireOperator } from '@/lib/operator-auth';
import { killProcessTree, waitForExit } from '@/lib/process-tree';

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
  const denied = requireOperator(req);
  if (denied) return denied;

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

  // Already settled (done/error/canceled) — don't clobber the terminal state or
  // kill an unrelated process that may now own the recycled pid (#70 P1.10).
  if (recorded && isTerminalStatus(recorded.status)) {
    logEvent('generate.cancel_noop', { lessonId, status: recorded.status });
    return NextResponse.json({ status: recorded.status });
  }

  if (recorded?.pid) {
    // Kill the whole tree (shell shim + the real tsx/claude child), then verify it
    // exited before settling the status — otherwise cancel could report success
    // while the expensive generation keeps running (#67).
    killProcessTree(recorded.pid);
    await waitForExit(recorded.pid, 3000);
  }

  writeFileSync(
    statusFile,
    `${JSON.stringify({ ...(recorded ?? {}), status: 'canceled' }, null, 2)}\n`,
    'utf-8',
  );
  logEvent('generate.canceled', { lessonId });

  return NextResponse.json({ status: 'canceled' });
}
