import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

// #60: deny-by-default authorization for operator/write routes (generate, ingest,
// regen, apply, cancel, comments, edits). The env trigger flags only decide where
// the pipeline *runs* — they are not an authorization boundary. This is.

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** True if the request is allowed to perform operator/write actions. */
export function isOperatorAuthorized(req: NextRequest): boolean {
  // Local-operator bypass: explicit opt-in AND never honored in production, so it
  // cannot authorize a deployed instance even if the flag leaks (mirrors access.ts).
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
  ) {
    return true;
  }
  // Fail closed: with no operator token configured, deny every operator action.
  const expected = process.env.OPERATOR_TOKEN;
  if (!expected) return false;
  const provided = req.headers.get('x-operator-token') ?? '';
  return safeEqual(provided, expected);
}

/** Guard for operator routes: returns a 401 to short-circuit, or null to continue. */
export function requireOperator(req: NextRequest): NextResponse | null {
  if (isOperatorAuthorized(req)) return null;
  return NextResponse.json({ error: 'Operator authorization required' }, { status: 401 });
}
