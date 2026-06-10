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
