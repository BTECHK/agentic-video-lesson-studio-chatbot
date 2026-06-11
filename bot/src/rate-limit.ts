/**
 * Per-user sliding-window rate limit (Denial-of-Wallet guard). Keyed by channel
 * user id (Telegram chat id / web session). In-memory is fine for the MVP; swap
 * for Redis when multi-instance. Gemini free tier is itself a hard spend ceiling.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private perMinute = Number(process.env.RATE_LIMIT_PER_MIN ?? 12),
    private now: () => number = () => Date.now(),
  ) {}

  /** Returns true if allowed; records the hit. */
  allow(userId: string): boolean {
    const t = this.now();
    const windowStart = t - 60_000;
    const arr = (this.hits.get(userId) ?? []).filter((ts) => ts > windowStart);
    if (arr.length >= this.perMinute) {
      this.hits.set(userId, arr);
      return false;
    }
    arr.push(t);
    this.hits.set(userId, arr);
    return true;
  }
}

/**
 * Global daily request ceiling — a single process-wide circuit breaker across ALL
 * users/channels. On the Gemini free tier the spend cap is $0 (the free tier IS
 * the ceiling), so this protects availability/quota today; the moment a PAID key
 * is wired in, this same cap becomes the hard spend guard. Set DAILY_REQUEST_CAP=0
 * to disable. In-memory (resets on cold start) — fine for a single-instance pilot;
 * back it with a store when multi-instance.
 */
export class GlobalDailyCap {
  private day = -1;
  private count = 0;
  constructor(
    private cap = Number(process.env.DAILY_REQUEST_CAP ?? 1000),
    private now: () => number = () => Date.now(),
  ) {}

  /** Returns true if under the daily cap; records the hit. Cap 0 = unlimited. */
  allow(): boolean {
    if (this.cap <= 0) return true;
    const today = Math.floor(this.now() / 86_400_000);
    if (today !== this.day) {
      this.day = today;
      this.count = 0;
    }
    if (this.count >= this.cap) return false;
    this.count += 1;
    return true;
  }

  get used(): number {
    return this.count;
  }
}
