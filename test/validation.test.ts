import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import {
  validateFileSize,
  validateResolution,
  validateFps,
  validateDuration,
  detectBlankFrame,
  verifyFontRendering,
} from '../scripts/verify';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('Post-Render Validation', () => {
  // Generate fixture PNGs before tests run
  beforeAll(async () => {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // 100x100 all-white PNG
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'blank-white.png'));

    // 100x100 all-black PNG
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'blank-black.png'));

    // 100x100 PNG with varied colors (gradient-like noise)
    const width = 100;
    const height = 100;
    const channels = 3;
    const pixels = Buffer.alloc(width * height * channels);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        pixels[idx] = (x * 2 + y * 3) % 256;     // R
        pixels[idx + 1] = (x * 5 + y * 7) % 256;  // G
        pixels[idx + 2] = (x * 11 + y * 13) % 256; // B
      }
    }
    await sharp(pixels, { raw: { width, height, channels } })
      .png()
      .toFile(path.join(FIXTURES_DIR, 'non-blank.png'));
  });

  describe('validateFileSize', () => {
    it('returns passed=true for file under 1.8GB', () => {
      const result = validateFileSize(1_000_000_000); // 1GB
      expect(result.passed).toBe(true);
    });

    it('returns passed=false for file at 1.8GB', () => {
      const result = validateFileSize(1_932_735_283); // exactly 1.8GB
      expect(result.passed).toBe(false);
    });

    it('returns passed=false for file over 1.8GB', () => {
      const result = validateFileSize(2_000_000_000); // ~1.86GB
      expect(result.passed).toBe(false);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('validateResolution', () => {
    it('returns passed=true for 1920x1080', () => {
      const result = validateResolution(1920, 1080);
      expect(result.passed).toBe(true);
      expect(result).toHaveProperty('width', 1920);
      expect(result).toHaveProperty('height', 1080);
    });

    it('returns passed=false for 1280x720', () => {
      const result = validateResolution(1280, 720);
      expect(result.passed).toBe(false);
    });

    it('returns passed=false for wrong width only', () => {
      const result = validateResolution(1280, 1080);
      expect(result.passed).toBe(false);
    });
  });

  describe('validateFps', () => {
    it('returns passed=true for 30fps', () => {
      const result = validateFps(30);
      expect(result.passed).toBe(true);
      expect(result).toHaveProperty('value', 30);
    });

    it('returns passed=false for 24fps', () => {
      const result = validateFps(24);
      expect(result.passed).toBe(false);
    });

    it('returns passed=false for 60fps', () => {
      const result = validateFps(60);
      expect(result.passed).toBe(false);
    });
  });

  describe('validateDuration', () => {
    it('returns passed=true when within 0.5s of expected', () => {
      const result = validateDuration(10.3, 10.0);
      expect(result.passed).toBe(true);
    });

    it('returns passed=true at exactly 0.5s difference', () => {
      const result = validateDuration(10.5, 10.0);
      expect(result.passed).toBe(true);
    });

    it('returns passed=false when more than 0.5s off', () => {
      const result = validateDuration(11.0, 10.0);
      expect(result.passed).toBe(false);
      expect(result).toHaveProperty('actual', 11.0);
      expect(result).toHaveProperty('expected', 10.0);
    });

    it('returns passed=false when actual is shorter than expected by >0.5s', () => {
      const result = validateDuration(9.0, 10.0);
      expect(result.passed).toBe(false);
    });
  });

  describe('detectBlankFrame', () => {
    it('returns true for all-white image', async () => {
      const result = await detectBlankFrame(
        path.join(FIXTURES_DIR, 'blank-white.png'),
      );
      expect(result).toBe(true);
    });

    it('returns true for all-black image', async () => {
      const result = await detectBlankFrame(
        path.join(FIXTURES_DIR, 'blank-black.png'),
      );
      expect(result).toBe(true);
    });

    it('returns false for image with color variation', async () => {
      const result = await detectBlankFrame(
        path.join(FIXTURES_DIR, 'non-blank.png'),
      );
      expect(result).toBe(false);
    });
  });

  describe('verifyFontRendering', () => {
    it('returns true for image with sufficient pixel variance', async () => {
      const result = await verifyFontRendering(
        path.join(FIXTURES_DIR, 'non-blank.png'),
      );
      expect(result).toBe(true);
    });

    it('returns false for blank/uniform image', async () => {
      const result = await verifyFontRendering(
        path.join(FIXTURES_DIR, 'blank-white.png'),
      );
      expect(result).toBe(false);
    });
  });
});
