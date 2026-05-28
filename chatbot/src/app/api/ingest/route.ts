import { NextRequest } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { IngestTriggerSchema, buildIngestArgs } from '@/lib/ingest-trigger';
import { requireOperator } from '@/lib/operator-auth';
import { readIdempotentReplay, writeIdempotentResult } from '@/lib/idempotency';

/**
 * Manual ingestion trigger (Phase 8.5). Builds safe CLI args and, when enabled
 * on the pipeline host (INGEST_TRIGGER_ENABLED=true), spawns the ingest run
 * detached. In environments without the pipeline (e.g. the standalone chatbot
 * container) it returns 503 rather than pretending to run.
 */
export async function POST(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;
  const replay = readIdempotentReplay('ingest', req);
  if (replay) return replay;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return writeIdempotentResult('ingest', req, { error: 'Invalid JSON' }, 400);
  }

  const parsed = IngestTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return writeIdempotentResult(
      'ingest',
      req,
      { error: 'Invalid request', details: parsed.error.issues },
      400,
    );
  }

  let args: string[];
  try {
    args = buildIngestArgs(parsed.data);
  } catch (err) {
    return writeIdempotentResult(
      'ingest',
      req,
      { error: err instanceof Error ? err.message : 'Bad trigger' },
      400,
    );
  }

  if (process.env.INGEST_TRIGGER_ENABLED !== 'true') {
    return writeIdempotentResult(
      'ingest',
      req,
      {
        status: 'disabled',
        message: 'Ingestion triggering is disabled here. Run on the pipeline host with INGEST_TRIGGER_ENABLED=true.',
        args,
      },
      503,
    );
  }

  const root = path.join(process.cwd(), '..');
  const child = spawn('npx', ['tsx', 'scripts/ingest.ts', ...args], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  return writeIdempotentResult('ingest', req, { status: 'queued', args });
}
