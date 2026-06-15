import { describe, it, expect } from 'vitest';
import { RateLimiter, GlobalDailyCap } from '../src/rate-limit.js';

describe('RateLimiter', () => {
  it('allows up to the per-minute limit then blocks', () => {
    const t = 1_000_000;
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
    const t = 1_000_000;
    const rl = new RateLimiter(1, () => t);
    expect(rl.allow('a')).toBe(true);
    expect(rl.allow('b')).toBe(true); // different user not blocked
    expect(rl.allow('a')).toBe(false);
  });
});

describe('GlobalDailyCap', () => {
  it('allows up to the cap across all callers, then blocks', () => {
    const t = 1_000_000;
    const cap = new GlobalDailyCap(2, () => t);
    expect(cap.allow()).toBe(true);
    expect(cap.allow()).toBe(true);
    expect(cap.allow()).toBe(false); // global, not per-user
    expect(cap.used).toBe(2);
  });

  it('resets when the day rolls over', () => {
    let t = 1_000_000;
    const cap = new GlobalDailyCap(1, () => t);
    expect(cap.allow()).toBe(true);
    expect(cap.allow()).toBe(false);
    t += 86_400_000; // next day
    expect(cap.allow()).toBe(true);
  });

  it('cap <= 0 means unlimited', () => {
    const cap = new GlobalDailyCap(0);
    for (let i = 0; i < 100; i++) expect(cap.allow()).toBe(true);
  });
});
