import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { RegenTriggerSchema, buildRegenArgs } from '@/lib/regen-trigger';
import { requireOperator } from '@/lib/operator-auth';

/**
 * Studio regenerate trigger (CTRL-03). A clip comment posts here to kick the
 * lesson's regeneration DAG. Runs only on the pipeline host
 * (REGEN_TRIGGER_ENABLED=true), where docker + Remotion are available; elsewhere
 * it returns 503 rather than pretending the rebuild ran.
 *
 * NOTE: applying the comment's *intent* to the upstream content (the AI edit
 * step) is not yet automated — this kicks the deterministic rebuild of whatever
 * is already stale.
 */
export async function POST(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RegenTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }

  let args: string[];
  try {
    args = buildRegenArgs(parsed.data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Bad trigger' }, { status: 400 });
  }

  if (process.env.REGEN_TRIGGER_ENABLED !== 'true') {
    return NextResponse.json(
      {
        status: 'disabled',
        message: 'Regeneration runs on the pipeline host (REGEN_TRIGGER_ENABLED=true, docker + Remotion).',
        args,
      },
      { status: 503 },
    );
  }

  const root = path.join(process.cwd(), '..');
  const child = spawn('npx', ['tsx', 'scripts/regenerate.ts', ...args], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  return NextResponse.json({ status: 'queued', args });
}
