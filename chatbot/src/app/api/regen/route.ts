import { NextRequest } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { RegenTriggerSchema, buildRegenArgs } from '@/lib/regen-trigger';
import { requireOperator } from '@/lib/operator-auth';
import { readIdempotentReplay, writeIdempotentResult } from '@/lib/idempotency';

/**
 * Studio regenerate trigger (CTRL-03). A clip comment posts here to kick the
 * lesson's regeneration DAG. Runs only on the pipeline host
 * (REGEN_TRIGGER_ENABLED=true), where docker + Remotion are available; elsewhere
 * it returns 503 rather than pretending the rebuild ran.
 *
 * When a comment is present it is direction for the AI: regenerate.ts runs the
 * AI-edit step (#18) to apply the comment to script.json, then the deterministic
 * DAG cascades the change. With no comment it just rebuilds whatever is stale.
 */
export async function POST(req: NextRequest) {
  const denied = requireOperator(req);
  if (denied) return denied;
  const replay = readIdempotentReplay('regen', req);
  if (replay) return replay;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return writeIdempotentResult('regen', req, { error: 'Invalid JSON' }, 400);
  }

  const parsed = RegenTriggerSchema.safeParse(body);
  if (!parsed.success) {
    return writeIdempotentResult(
      'regen',
      req,
      { error: 'Invalid request', details: parsed.error.issues },
      400,
    );
  }

  let args: string[];
  try {
    args = buildRegenArgs(parsed.data);
  } catch (err) {
    return writeIdempotentResult(
      'regen',
      req,
      { error: err instanceof Error ? err.message : 'Bad trigger' },
      400,
    );
  }

  if (process.env.REGEN_TRIGGER_ENABLED !== 'true') {
    return writeIdempotentResult(
      'regen',
      req,
      {
        status: 'disabled',
        message: 'Regeneration runs on the pipeline host (REGEN_TRIGGER_ENABLED=true, docker + Remotion).',
        args,
      },
      503,
    );
  }

  const root = path.join(process.cwd(), '..');
  const child = spawn('npx', ['tsx', 'scripts/regenerate.ts', ...args], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  return writeIdempotentResult('regen', req, { status: 'queued', args });
}
