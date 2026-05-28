import { NextRequest, NextResponse } from 'next/server';

export type RateLimitScope = 'access' | 'session' | 'chat' | 'operator';

interface RateLimitPolicy {
  windowMs: number;
  max: number;
}

interface RateLimitState {
  hits: number[];
}

interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
}

// In-memory limiter is intentional for MVP/local-host usage. Post-launch can swap
// to a shared backend if we need multi-instance consistency.
const state = new Map<string, RateLimitState>();

const DEFAULT_POLICY: Record<RateLimitScope, RateLimitPolicy> = {
  access: { windowMs: 60_000, max: 15 },
  session: { windowMs: 60_000, max: 25 },
  chat: { windowMs: 60_000, max: 40 },
  operator: { windowMs: 60_000, max: 25 },
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function header(req: NextRequest, name: string): string | null {
  const maybeHeaders = (req as { headers?: { get?: (key: string) => string | null } }).headers;
  if (!maybeHeaders || typeof maybeHeaders.get !== 'function') return null;
  return maybeHeaders.get(name);
}

function policyFor(scope: RateLimitScope): RateLimitPolicy {
  const base = DEFAULT_POLICY[scope];
  return {
    windowMs: parsePositiveInt(
      process.env[`RATE_LIMIT_${scope.toUpperCase()}_WINDOW_MS`],
      base.windowMs,
    ),
    max: parsePositiveInt(process.env[`RATE_LIMIT_${scope.toUpperCase()}_MAX`], base.max),
  };
}

function clientFingerprint(req: NextRequest): string {
  const xff = header(req, 'x-forwarded-for');
  const forwardedIp = xff?.split(',')[0]?.trim();
  const realIp = header(req, 'x-real-ip')?.trim();
  const fallback = header(req, 'user-agent')?.slice(0, 120) ?? 'unknown';
  return forwardedIp || realIp || fallback;
}

export function rateLimitKey(req: NextRequest, scope: RateLimitScope, suffix = ''): string {
  const fp = clientFingerprint(req);
  return suffix ? `${scope}:${fp}:${suffix}` : `${scope}:${fp}`;
}

export function decideRateLimit(
  key: string,
  policy: RateLimitPolicy,
  nowMs = Date.now(),
): RateLimitDecision {
  const windowStart = nowMs - policy.windowMs;
  const current = state.get(key) ?? { hits: [] };
  const activeHits = current.hits.filter((ts) => ts > windowStart);

  if (activeHits.length >= policy.max) {
    const oldest = activeHits[0] ?? nowMs;
    const retryAfterMs = Math.max(1_000, oldest + policy.windowMs - nowMs);
    return {
      allowed: false,
      limit: policy.max,
      remaining: 0,
      resetAtMs: nowMs + retryAfterMs,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1_000),
    };
  }

  activeHits.push(nowMs);
  state.set(key, { hits: activeHits });
  return {
    allowed: true,
    limit: policy.max,
    remaining: Math.max(0, policy.max - activeHits.length),
    resetAtMs: nowMs + policy.windowMs,
    retryAfterSeconds: Math.ceil(policy.windowMs / 1_000),
  };
}

export function requireRateLimit(
  req: NextRequest,
  scope: RateLimitScope,
  suffix = '',
): NextResponse | null {
  const policy = policyFor(scope);
  const key = rateLimitKey(req, scope, suffix);
  const decision = decideRateLimit(key, policy);
  if (decision.allowed) return null;

  return NextResponse.json(
    {
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      scope,
      retryAfterSeconds: decision.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(decision.retryAfterSeconds),
        'X-RateLimit-Limit': String(decision.limit),
        'X-RateLimit-Remaining': String(decision.remaining),
        'X-RateLimit-Reset': String(Math.floor(decision.resetAtMs / 1_000)),
      },
    },
  );
}

export function resetRateLimitState(): void {
  state.clear();
}
