import { describe, it, expect, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { isOperatorAuthorized } from '@/lib/operator-auth';

// #60: operator/write routes must be deny-by-default. A learner (or any
// unauthenticated caller) must never be able to trigger generate/ingest/regen/
// apply or write comments/edits.

const reqWith = (token?: string) =>
  ({
    headers: { get: (k: string) => (k === 'x-operator-token' ? token ?? null : null) },
  }) as unknown as NextRequest;

describe('isOperatorAuthorized (deny-by-default)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('denies when no OPERATOR_TOKEN is configured (fail closed)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OPERATOR_TOKEN', '');
    expect(isOperatorAuthorized(reqWith('anything'))).toBe(false);
  });

  it('denies a wrong or absent operator token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OPERATOR_TOKEN', 'secret-op');
    expect(isOperatorAuthorized(reqWith('wrong'))).toBe(false);
    expect(isOperatorAuthorized(reqWith(undefined))).toBe(false);
  });

  it('allows the matching operator token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('OPERATOR_TOKEN', 'secret-op');
    expect(isOperatorAuthorized(reqWith('secret-op'))).toBe(true);
  });

  it('allows the local dev bypass outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_DEV_BYPASS', 'true');
    expect(isOperatorAuthorized(reqWith(undefined))).toBe(true);
  });

  it('ignores the dev bypass in production (cannot be enabled by accident)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DEV_BYPASS', 'true');
    vi.stubEnv('OPERATOR_TOKEN', '');
    expect(isOperatorAuthorized(reqWith(undefined))).toBe(false);
  });
});

describe('operator route authorization (unauth write => 401)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('ingest POST returns 401 without operator auth', async () => {
    // Default vitest env: not production, no dev bypass, no OPERATOR_TOKEN => deny.
    const { POST } = await import('@/app/api/ingest/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ mode: 'poll' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('regen POST returns 401 without operator auth', async () => {
    const { POST } = await import('@/app/api/regen/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/regen', {
      method: 'POST',
      body: JSON.stringify({ lessonId: 'module-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
