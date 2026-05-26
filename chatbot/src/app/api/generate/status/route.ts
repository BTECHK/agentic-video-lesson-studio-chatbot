import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { resolveGenerationStatus, type RecordedStatus } from '@/lib/generation-status';
import { statusFilePath } from '../route';

/**
 * Status of a decoupled Studio Generate job (#44). Reads the status file, probes
 * pid liveness, and resolves the settled state via the pure resolver. When the
 * job has settled to done/error, the result is persisted back so the answer is
 * stable on subsequent polls (and survives a server restart). On `done`, the
 * draft + fact-check are loaded and returned for the panel to render.
 */
const LESSON_RE = /^[a-z0-9-]+$/;

interface StatusFile {
  status: RecordedStatus;
  pid?: number;
  startedAt?: string;
}

function pidAlive(pid: number | undefined): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lessonId') ?? '';
  if (!LESSON_RE.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
  }

  const root = path.join(process.cwd(), '..');
  const dir = path.join(root, 'content', 'lessons', lessonId);
  const statusFile = statusFilePath(root, lessonId);
  const draftPath = path.join(dir, 'script.draft.json');

  let recorded: StatusFile | null = null;
  if (existsSync(statusFile)) {
    try {
      recorded = JSON.parse(readFileSync(statusFile, 'utf-8')) as StatusFile;
    } catch {
      recorded = null;
    }
  }

  const draftExists = existsSync(draftPath);
  const draftMtimeMs = draftExists ? statSync(draftPath).mtimeMs : 0;
  const startedAtMs = recorded?.startedAt ? Date.parse(recorded.startedAt) : 0;

  const status = resolveGenerationStatus({
    hasStatusFile: recorded != null,
    recorded: recorded?.status,
    pidAlive: pidAlive(recorded?.pid),
    draftExists,
    draftMtimeMs,
    startedAtMs,
  });

  // Persist a freshly-settled result so subsequent polls are stable.
  if (recorded && recorded.status === 'running' && (status === 'done' || status === 'error')) {
    writeFileSync(
      statusFile,
      `${JSON.stringify({ ...recorded, status }, null, 2)}\n`,
      'utf-8',
    );
  }

  if (status === 'done' && draftExists) {
    const draft = JSON.parse(readFileSync(draftPath, 'utf-8'));
    const reportPath = path.join(dir, 'script.factcheck.json');
    const factCheck = existsSync(reportPath)
      ? JSON.parse(readFileSync(reportPath, 'utf-8'))
      : null;
    return NextResponse.json({ status, draft, factCheck });
  }

  return NextResponse.json({ status });
}
