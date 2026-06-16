import { describe, it, expect } from 'vitest';
import { sizzleDimensions, sizzleReelMetadata, SIZZLE_DURATION } from '../src/compositions/SizzleReel';

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
});
