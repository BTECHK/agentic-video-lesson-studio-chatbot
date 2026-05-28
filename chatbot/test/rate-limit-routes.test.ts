import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitState } from '@/lib/rate-limit';
import { sessionStore } from '@/lib/session';

function jsonPost(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('route rate limits (#61)', () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.stubEnv('LLM_PROVIDER', 'mock');
  });

  afterEach(() => {
    resetRateLimitState();
    vi.unstubAllEnvs();
  });

  it('returns structured 429 on access-code burst traffic', async () => {
    vi.stubEnv('RATE_LIMIT_ACCESS_MAX', '2');
    vi.stubEnv('RATE_LIMIT_ACCESS_WINDOW_MS', '60000');
    const { POST } = await import('@/app/api/access/route');
    const headers = { 'x-forwarded-for': '198.51.100.10' };

    await POST(jsonPost('http://localhost/api/access', { code: 'wrong' }, headers));
    await POST(jsonPost('http://localhost/api/access', { code: 'wrong' }, headers));
    const blocked = await POST(jsonPost('http://localhost/api/access', { code: 'wrong' }, headers));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    const body = await blocked.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.scope).toBe('access');
  });

  it('rate-limits session creation bursts', async () => {
    vi.stubEnv('RATE_LIMIT_SESSION_MAX', '1');
    vi.stubEnv('RATE_LIMIT_SESSION_WINDOW_MS', '60000');
    const { POST } = await import('@/app/api/session/route');
    const headers = { 'x-forwarded-for': '198.51.100.11' };

    const first = await POST(jsonPost('http://localhost/api/session', { accessMode: 'demo' }, headers));
    expect(first.status).toBe(200);

    const second = await POST(jsonPost('http://localhost/api/session', { accessMode: 'demo' }, headers));
    expect(second.status).toBe(429);
    expect((await second.json()).code).toBe('RATE_LIMITED');
  });

  it('rate-limits chat bursts per session', async () => {
    vi.stubEnv('RATE_LIMIT_CHAT_MAX', '1');
    vi.stubEnv('RATE_LIMIT_CHAT_WINDOW_MS', '60000');
    const { POST } = await import('@/app/api/chat/route');
    const headers = { 'x-forwarded-for': '198.51.100.12' };
    const session = sessionStore.create('demo');

    const first = await POST(
      jsonPost(
        'http://localhost/api/chat',
        { message: 'What is ChatGPT?', sessionId: `${session.id}-missing`, mode: 'ta' },
        headers,
      ),
    );
    expect(first.status).toBe(404);

    const second = await POST(
      jsonPost(
        'http://localhost/api/chat',
        { message: 'Second question', sessionId: `${session.id}-missing`, mode: 'ta' },
        headers,
      ),
    );
    expect(second.status).toBe(429);
    expect((await second.json()).scope).toBe('chat');
  });

  it('rate-limits operator routes before auth checks', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RATE_LIMIT_OPERATOR_MAX', '1');
    vi.stubEnv('RATE_LIMIT_OPERATOR_WINDOW_MS', '60000');
    const { POST } = await import('@/app/api/ingest/route');
    const headers = { 'x-forwarded-for': '198.51.100.13' };

    const first = await POST(jsonPost('http://localhost/api/ingest', { mode: 'poll' }, headers));
    expect(first.status).toBe(401);

    const second = await POST(jsonPost('http://localhost/api/ingest', { mode: 'poll' }, headers));
    expect(second.status).toBe(429);
    const body = await second.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body.scope).toBe('operator');
  });
});
