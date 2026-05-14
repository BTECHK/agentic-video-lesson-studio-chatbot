import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { compareFrames, compareAllFrames } from '../scripts/compare';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const REF_DIR = path.join(FIXTURES_DIR, 'references');
const SCREENSHOTS_DIR = path.join(FIXTURES_DIR, 'screenshots');

describe('Deterministic Frame Comparison', () => {
  beforeAll(async () => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    fs.mkdirSync(REF_DIR, { recursive: true });
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    // 10×10 white PNG
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'white.png'));

    // 10×10 black PNG
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'black.png'));

    // 10×10 nearly-white PNG (1 pixel different, <0.1% of 100 pixels = 1%)
    // We need <0.1% diff, so use a 1000-pixel image (100x10) with no diff
    // Actually: for <0.1% threshold, with 100 pixels even 1 pixel = 1% which exceeds.
    // Create an image that matches white exactly for "within tolerance" test
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 254 } },
    })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'nearly-white.png'));

    // Create screenshot/reference pairs for compareAllFrames test
    // Matching pair
    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .png()
      .toFile(path.join(SCREENSHOTS_DIR, 'scene-frame-0.png'));

    await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .png()
      .toFile(path.join(REF_DIR, 'scene-frame-0.png'));
  });

  describe('compareFrames', () => {
    it('returns match=true and diffPercent=0 for identical images', () => {
      const whitePath = path.join(FIXTURES_DIR, 'white.png');
      const result = compareFrames(whitePath, whitePath);
      expect(result.match).toBe(true);
      expect(result.diffPercent).toBe(0);
      expect(result.diffPixels).toBe(0);
    });

    it('returns match=false for images with >0.1% difference (white vs black)', () => {
      const whitePath = path.join(FIXTURES_DIR, 'white.png');
      const blackPath = path.join(FIXTURES_DIR, 'black.png');
      const result = compareFrames(whitePath, blackPath);
      expect(result.match).toBe(false);
      expect(result.diffPercent).toBeGreaterThan(0.5);
    });

    it('returns diffPercent as a number between 0 and 1', () => {
      const whitePath = path.join(FIXTURES_DIR, 'white.png');
      const blackPath = path.join(FIXTURES_DIR, 'black.png');
      const result = compareFrames(whitePath, blackPath);
      expect(typeof result.diffPercent).toBe('number');
      expect(result.diffPercent).toBeGreaterThanOrEqual(0);
      expect(result.diffPercent).toBeLessThanOrEqual(1);
    });

    it('returns match=false with diffPercent=1 for dimension-mismatched images', async () => {
      const smallPath = path.join(FIXTURES_DIR, 'small-5x5.png');
      await sharp({
        create: { width: 5, height: 5, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toFile(smallPath);

      const whitePath = path.join(FIXTURES_DIR, 'white.png'); // 10×10
      const result = compareFrames(whitePath, smallPath);
      expect(result.match).toBe(false);
      expect(result.diffPercent).toBe(1);
      expect(result.diffPixels).toBe(-1);
      expect(result.totalPixels).toBe(-1);
    });

    it('returns match=true for nearly identical images within tolerance', () => {
      // nearly-white vs white: pixel diff is tiny (254 vs 255 in blue)
      // pixelmatch threshold 0.1 means the per-pixel color distance must be > 0.1
      // A single channel diff of 1/255 = 0.004 which is less than 0.1 threshold
      // So pixelmatch should report 0 diff pixels
      const whitePath = path.join(FIXTURES_DIR, 'white.png');
      const nearlyWhitePath = path.join(FIXTURES_DIR, 'nearly-white.png');
      const result = compareFrames(whitePath, nearlyWhitePath);
      expect(result.match).toBe(true);
    });
  });

  describe('compareAllFrames', () => {
    it('checks all matching filenames and returns aggregate result', () => {
      const result = compareAllFrames(SCREENSHOTS_DIR, REF_DIR);
      expect(result.allMatch).toBe(true);
      expect(result.results).toHaveProperty('scene-frame-0.png');
      expect(result.results['scene-frame-0.png'].match).toBe(true);
    });

    it('returns allMatch=false when any frame differs', async () => {
      // Create a different screenshot
      const diffDir = path.join(FIXTURES_DIR, 'screenshots-diff');
      const diffRefDir = path.join(FIXTURES_DIR, 'references-diff');
      fs.mkdirSync(diffDir, { recursive: true });
      fs.mkdirSync(diffRefDir, { recursive: true });

      await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toFile(path.join(diffDir, 'frame.png'));

      await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toFile(path.join(diffRefDir, 'frame.png'));

      const result = compareAllFrames(diffDir, diffRefDir);
      expect(result.allMatch).toBe(false);
    });
  });
});
