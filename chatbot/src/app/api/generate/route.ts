import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Studio Generate (CC-passthrough): runs the root headless generator, which uses
 * `claude -p` to draft a fact-checked script from the lesson's outline. Writes a
 * DRAFT (never the committed script.json); we return the draft + fact-check report
 * for review. Synchronous — generation takes ~1-2 min — with a hard timeout.
 *
 * Safe by design (gitignored draft, no committed mutation, no PRs), so it is not
 * env-gated; if `claude` is unavailable the run fails and we surface the error.
 */
const LESSON_RE = /^[a-z0-9-]+$/;
const TIMEOUT_MS = 6 * 60 * 1000;

/** Thrown when the client aborts the request (Studio Cancel). */
export class GenerationAbortedError extends Error {
  constructor() {
    super('aborted');
    this.name = 'GenerationAbortedError';
  }
}

interface RunOpts {
  signal?: AbortSignal;
  /** Injectable for tests; defaults to node:child_process spawn. */
  spawnFn?: typeof spawn;
}

export function runGenerator(
  lessonId: string,
  root: string,
  opts: RunOpts = {},
): Promise<{ code: number; stderr: string }> {
  const spawnFn = opts.spawnFn ?? spawn;
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new GenerationAbortedError());
      return;
    }
    const child = spawnFn('npx', ['tsx', 'scripts/generate-script-headless.ts', lessonId], {
      cwd: root,
      shell: true,
    });
    let stderr = '';
    child.stderr?.on('data', (d) => (stderr += d));

    const cleanup = () => {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      child.kill();
      cleanup();
      reject(new GenerationAbortedError());
    };
    const timer = setTimeout(() => {
      child.kill();
      cleanup();
      reject(new Error('generation timed out'));
    }, TIMEOUT_MS);

    opts.signal?.addEventListener('abort', onAbort);
    child.on('error', (e) => {
      cleanup();
      reject(e);
    });
    child.on('close', (code) => {
      cleanup();
      resolve({ code: code ?? 1, stderr });
    });
  });
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
  const dir = path.join(root, 'content', 'lessons', lessonId);
  if (!existsSync(path.join(dir, 'outline.json'))) {
    return NextResponse.json({ error: 'Lesson has no outline to generate from' }, { status: 404 });
  }

  let result: { code: number; stderr: string };
  try {
    result = await runGenerator(lessonId, root, { signal: req.signal });
  } catch (e) {
    if (e instanceof GenerationAbortedError) {
      // Client canceled — the child has been killed. Response is moot (the
      // client is gone) but return a clear status rather than a 500.
      return NextResponse.json({ error: 'canceled' }, { status: 499 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed to start' },
      { status: 500 },
    );
  }

  const draftPath = path.join(dir, 'script.draft.json');
  if (result.code !== 0 || !existsSync(draftPath)) {
    return NextResponse.json(
      { error: 'Generation failed', detail: result.stderr.slice(-400) },
      { status: 500 },
    );
  }

  const draft = JSON.parse(await readFile(draftPath, 'utf-8'));
  const reportPath = path.join(dir, 'script.factcheck.json');
  const factCheck = existsSync(reportPath) ? JSON.parse(await readFile(reportPath, 'utf-8')) : null;

  return NextResponse.json({ status: 'drafted', draft, factCheck });
}
