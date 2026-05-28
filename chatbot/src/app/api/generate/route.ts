import { NextRequest } from 'next/server';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { requireOperator } from '@/lib/operator-auth';
import { readIdempotentReplay, writeIdempotentResult } from '@/lib/idempotency';

/**
 * Studio Generate (CC-passthrough), decoupled from the HTTP request (#44).
 *
 * The root headless generator (`claude -p`) takes ~100s. Previously it was
 * awaited on the request and tied to `req.signal`, so client navigation aborted
 * the fetch and killed the child — losing the run. Now POST spawns the generator
 * as a DETACHED, unref'd background child, records a status file, and returns
 * immediately `{ status: 'running' }`. The client polls GET /api/generate/status
 * (and resumes on mount), and POST /api/generate/cancel kills the job on demand.
 *
 * Safe by design (gitignored draft, no committed mutation, no PRs).
 */
const LESSON_RE = /^[a-z0-9-]+$/;
const IDEMPOTENCY_ROUTE = 'generate';

interface StatusFile {
  status: 'running' | 'done' | 'error' | 'canceled';
  pid?: number;
  startedAt?: string;
}

/** Path to the per-lesson generation status file. */
export function statusFilePath(root: string, lessonId: string): string {
  return path.join(root, 'content', 'lessons', lessonId, '.generate-status.json');
}

/** True if a process with this pid is currently alive. */
function pidAlive(pid: number | undefined): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readStatusFile(file: string): StatusFile | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as StatusFile;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;
  const replay = readIdempotentReplay(IDEMPOTENCY_ROUTE, req);
  if (replay) return replay;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return writeIdempotentResult(IDEMPOTENCY_ROUTE, req, { error: 'Invalid JSON' }, 400);
  }
  const { lessonId } = (body ?? {}) as { lessonId?: string };
  if (!lessonId || !LESSON_RE.test(lessonId)) {
    return writeIdempotentResult(IDEMPOTENCY_ROUTE, req, { error: 'Invalid lessonId' }, 400);
  }

  const root = path.join(process.cwd(), '..');
  const dir = path.join(root, 'content', 'lessons', lessonId);
  if (!existsSync(path.join(dir, 'outline.json'))) {
    return writeIdempotentResult(
      IDEMPOTENCY_ROUTE,
      req,
      { error: 'Lesson has no outline to generate from' },
      404,
    );
  }

  // Don't double-spawn: if a job is already running for this lesson, report it.
  const statusFile = statusFilePath(root, lessonId);
  const existing = readStatusFile(statusFile);
  if (existing?.status === 'running' && pidAlive(existing.pid)) {
    return writeIdempotentResult(IDEMPOTENCY_ROUTE, req, { status: 'running' });
  }

  // Detached, unref'd background child — NOT awaited, NOT tied to req.signal.
  const child = spawn('npx', ['tsx', 'scripts/generate-script-headless.ts', lessonId], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  child.unref();

  const record: StatusFile = {
    status: 'running',
    pid: child.pid,
    startedAt: new Date().toISOString(),
  };
  writeFileSync(statusFile, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');

  return writeIdempotentResult(IDEMPOTENCY_ROUTE, req, { status: 'running' });
}
