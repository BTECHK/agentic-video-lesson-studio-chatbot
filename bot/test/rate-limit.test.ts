import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../src/rate-limit.js';

describe('RateLimiter', () => {
  it('allows up to the per-minute limit then blocks', () => {
    let t = 1_000_000;
    const rl = new RateLimiter(3, () => t);
    expect(rl.allow('u')).toBe(true);
    expect(rl.allow('u')).toBe(true);
    expect(rl.allow('u')).toBe(true);
    expect(rl.allow('u')).toBe(false);
  });

  it('frees up after the window slides past', () => {
    let t = 1_000_000;
    const rl = new RateLimiter(1, () => t);
    expect(rl.allow('u')).toBe(true);
    expect(rl.allow('u')).toBe(false);
    t += 61_000;
    expect(rl.allow('u')).toBe(true);
  });

  it('tracks users independently', () => {
    let t = 1_000_000;
    const rl = new RateLimiter(1, () => t);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('b')).toBe(true); // different user not blocked
    expect(rl.allow('a')).toBe(false);
  });
});
