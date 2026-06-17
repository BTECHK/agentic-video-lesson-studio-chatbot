import { describe, it, expect } from 'vitest';
import {
  sizzleDimensions,
  sizzleReelMetadata,
  SIZZLE_DURATION,
  SIZZLE_BEATS,
} from '../src/compositions/SizzleReel';

describe('sizzleDimensions', () => {
  it('is landscape 1920x1080 for 16:9', () => {
    expect(sizzleDimensions('16:9')).toEqual({ width: 1920, height: 1080 });
  });

  it('is portrait 1080x1920 for 9:16', () => {
    expect(sizzleDimensions('9:16')).toEqual({ width: 1080, height: 1920 });
  });
});

type Meta = { width: number; height: number; durationInFrames: number };
const meta = (props: Record<string, unknown>): Meta => sizzleReelMetadata({ props } as never) as Meta;

describe('sizzleReelMetadata', () => {
  it('renders both formats from one source via the format prop', () => {
    const wide = meta({ format: '16:9' });
    const tall = meta({ format: '9:16' });
    expect({ width: wide.width, height: wide.height }).toEqual({ width: 1920, height: 1080 });
    expect({ width: tall.width, height: tall.height }).toEqual({ width: 1080, height: 1920 });
    // Same duration regardless of format — one source, two shapes.
    expect(wide.durationInFrames).toBe(SIZZLE_DURATION);
    expect(tall.durationInFrames).toBe(SIZZLE_DURATION);
  });

  it('defaults to 16:9 when no format is given', () => {
    const m = meta({});
    expect({ width: m.width, height: m.height }).toEqual({ width: 1920, height: 1080 });
  });

  it('preserves the payoff + music props through metadata', () => {
    const m = sizzleReelMetadata({
      props: { format: '16:9', payoff: 'sizzle/payoff-lesson.mp4', music: 'sizzle/music-bed.m4a' },
    } as never) as { props: { payoff?: string; music?: string } };
    expect(m.props.payoff).toBe('sizzle/payoff-lesson.mp4');
    expect(m.props.music).toBe('sizzle/music-bed.m4a');
  });
});

describe('SIZZLE_BEATS timeline (#74 finished-lesson payoff)', () => {
  it('includes a finished-lesson payoff beat before the CTA', () => {
    const ids = SIZZLE_BEATS.map((b) => b.id);
    expect(ids).toContain('payoff');
    expect(ids.indexOf('payoff')).toBeLessThan(ids.indexOf('cta'));
  });

  it('ends exactly at SIZZLE_DURATION', () => {
    const last = SIZZLE_BEATS[SIZZLE_BEATS.length - 1];
    expect(last.from + last.duration).toBe(SIZZLE_DURATION);
  });

  it('beats are time-ordered and every beat fits within the reel', () => {
    for (let i = 1; i < SIZZLE_BEATS.length; i++) {
      expect(SIZZLE_BEATS[i].from).toBeGreaterThan(SIZZLE_BEATS[i - 1].from);
    }
    for (const b of SIZZLE_BEATS) {
      expect(b.from + b.duration).toBeLessThanOrEqual(SIZZLE_DURATION);
    }
  });
});
