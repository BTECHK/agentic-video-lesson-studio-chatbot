import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session';
import { SessionRequestSchema } from '@/lib/types';
import { validateAccessCode } from '@/lib/access';
import { requireRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { accessMode, accessCode } = parsed.data;
  const limited = requireRateLimit(req, 'session', accessMode);
  if (limited) return limited;

  if (accessMode === 'student') {
    if (!accessCode || !validateAccessCode(accessCode)) {
      return NextResponse.json(
        { error: 'Valid access code required for student mode' },
        { status: 401 },
      );
    }
  }

  const session = sessionStore.create(accessMode);
  return NextResponse.json({ sessionId: session.id, accessMode: session.accessMode });
}
