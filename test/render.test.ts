import { describe, it, expect } from 'vitest';
import { SCENES, getScreenshotFrames, getScreenshotPath } from '../scripts/render';

describe('Render Script Configuration', () => {
  it('defines 3 scenes', () => {
    expect(SCENES).toHaveLength(3);
  });

  it('has correct scene names', () => {
    expect(SCENES.map((s) => s.name)).toEqual([
      'typography',
      'brand-elements',
      'motion-test',
    ]);
  });

  it('has correct frame ranges', () => {
    expect(SCENES[0]).toEqual({
      name: 'typography',
      startFrame: 0,
      endFrame: 89,
    });
    expect(SCENES[1]).toEqual({
      name: 'brand-elements',
      startFrame: 90,
      endFrame: 179,
    });
    expect(SCENES[2]).toEqual({
      name: 'motion-test',
      startFrame: 180,
      endFrame: 299,
    });
  });
});

describe('getScreenshotFrames', () => {
  it('returns start, midpoint, end for typography scene', () => {
    expect(getScreenshotFrames(SCENES[0])).toEqual([0, 45, 89]);
  });

  it('returns start, midpoint, end for brand-elements scene', () => {
    expect(getScreenshotFrames(SCENES[1])).toEqual([90, 135, 179]);
  });

  it('returns start, midpoint, end for motion-test scene', () => {
    expect(getScreenshotFrames(SCENES[2])).toEqual([180, 240, 299]);
  });
});

describe('getScreenshotPath', () => {
  it('generates correct screenshot file path', () => {
    const result = getScreenshotPath('typography', 0);
    expect(result).toContain('typography');
    expect(result).toContain('frame-0');
    expect(result).toMatch(/\.png$/);
  });

  it('includes output/verification/screenshots in path', () => {
    const result = getScreenshotPath('brand-elements', 90);
    expect(result).toContain('output/verification/screenshots');
    expect(result).toContain('brand-elements');
    expect(result).toContain('frame-90');
  });
});
