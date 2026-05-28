import { NextRequest, NextResponse } from 'next/server';

interface CachedResponse {
  body: unknown;
  status: number;
  expiresAtMs: number;
}

const cache = new Map<string, CachedResponse>();
const DEFAULT_TTL_MS = 10 * 60 * 1_000;
const MAX_KEY_LEN = 200;

function header(req: NextRequest, name: string): string | null {
  const maybeHeaders = (req as { headers?: { get?: (key: string) => string | null } }).headers;
  if (!maybeHeaders || typeof maybeHeaders.get !== 'function') return null;
  return maybeHeaders.get(name);
}

function getKeyHeader(req: NextRequest): string | null {
  const key = header(req, 'x-idempotency-key')?.trim() ?? '';
  if (!key) return null;
  if (key.length > MAX_KEY_LEN) return null;
  return key;
}

function cacheKey(route: string, key: string): string {
  return `${route}:${key}`;
}

export function readIdempotentReplay(route: string, req: NextRequest): NextResponse | null {
  const key = getKeyHeader(req);
  if (!key) return null;
  const ck = cacheKey(route, key);
  const cached = cache.get(ck);
  if (!cached) return null;
  if (cached.expiresAtMs <= Date.now()) {
    cache.delete(ck);
    return null;
  }
  return NextResponse.json(
    {
      ...(cached.body as Record<string, unknown>),
      idempotentReplay: true,
    },
    { status: cached.status },
  );
}

export function writeIdempotentResult(
  route: string,
  req: NextRequest,
  body: unknown,
  status = 200,
): NextResponse {
  const key = getKeyHeader(req);
  const ttlMs = Number(process.env.IDEMPOTENCY_TTL_MS) || DEFAULT_TTL_MS;
  if (key) {
    cache.set(cacheKey(route, key), {
      body,
      status,
      expiresAtMs: Date.now() + Math.max(1_000, ttlMs),
    });
  }
  return NextResponse.json(body, { status });
}

export function resetIdempotencyCache(): void {
  cache.clear();
}
