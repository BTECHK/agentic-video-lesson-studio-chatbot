import { NextRequest, NextResponse } from 'next/server';
import { validateAccessCode } from '@/lib/access';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { code } = (body ?? {}) as { code?: string };

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { valid: false, error: 'Access code required' },
      { status: 400 },
    );
  }

  const valid = validateAccessCode(code);
  if (valid) {
    return NextResponse.json({ valid: true, mode: 'student' as const });
  }
  return NextResponse.json(
    { valid: false, error: 'Invalid access code' },
    { status: 401 },
  );
}
