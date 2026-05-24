import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { IngestTriggerSchema, buildIngestArgs } from '@/lib/ingest-trigger';

/**
 * Manual ingestion trigger (Phase 8.5). Builds safe CLI args and, when enabled
 * on the pipeline host (INGEST_TRIGGER_ENABLED=true), spawns the ingest run
 * detached. In environments without the pipeline (e.g. the standalone chatbot
 * container) it returns 503 rather than pretending to run.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = IngestTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  let args: string[];
  try {
    args = buildIngestArgs(parsed.data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Bad trigger' }, { status: 400 });
  }

  if (process.env.INGEST_TRIGGER_ENABLED !== 'true') {
    return NextResponse.json(
      {
        status: 'disabled',
        message: 'Ingestion triggering is disabled here. Run on the pipeline host with INGEST_TRIGGER_ENABLED=true.',
        args,
      },
      { status: 503 },
    );
  }

  const root = path.join(process.cwd(), '..');
  const child = spawn('npx', ['tsx', 'scripts/ingest.ts', ...args], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  return NextResponse.json({ status: 'queued', args });
}
