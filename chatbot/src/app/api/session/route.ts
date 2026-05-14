import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session';
import type { AccessMode } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const accessMode = (body.accessMode === 'student' ? 'student' : 'demo') as AccessMode;
  const session = sessionStore.create(accessMode);
  return NextResponse.json({ sessionId: session.id, accessMode: session.accessMode });
}
