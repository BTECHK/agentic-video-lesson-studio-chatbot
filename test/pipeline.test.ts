import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing pipeline
vi.mock('../scripts/render', () => ({
  SCENES: [
    { name: 'typography', startFrame: 0, endFrame: 89 },
    { name: 'brand-elements', startFrame: 90, endFrame: 179 },
    { name: 'motion-test', startFrame: 180, endFrame: 299 },
  ],
  getScreenshotFrames: vi.fn((scene: { startFrame: number; endFrame: number }) => {
    const start = scene.startFrame;
    const end = scene.endFrame;
    const duration = end - start + 1;
    const mid = start + Math.floor(duration / 2);
    return [start, mid, end];
  }),
}));

vi.mock('../scripts/verify', () => ({
  validateRender: vi.fn(),
}));

vi.mock('../scripts/gallery', () => ({
  generateGallery: vi.fn().mockReturnValue('<html></html>'),
}));

vi.mock('../scripts/compare', () => ({
  compareAllFrames: vi.fn().mockReturnValue({ allMatch: true, results: {} }),
}));

// Mock fs for mkdir and existsSync
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: {
      ...actual,
      mkdirSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(true),
      readFileSync: actual.readFileSync,
    },
    mkdirSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: actual.readFileSync,
  };
});

// Mock @remotion/bundler
vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn().mockResolvedValue('http://localhost:3000/bundle'),
}));

// Mock @remotion/renderer
vi.mock('@remotion/renderer', () => ({
  renderMedia: vi.fn().mockResolvedValue(undefined),
  renderStill: vi.fn().mockResolvedValue(undefined),
  selectComposition: vi.fn().mockResolvedValue({
    id: 'BrandShowcase',
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
  }),
}));

import { runPipeline, type PipelineResult } from '../scripts/pipeline';
import { validateRender } from '../scripts/verify';
import { generateGallery } from '../scripts/gallery';
import { compareAllFrames } from '../scripts/compare';

describe('Pipeline Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct PipelineResult shape with all required fields', async () => {
    vi.mocked(validateRender).mockResolvedValue({
      passed: true,
      timestamp: '2026-05-13T00:00:00Z',
      checks: {
        fileSize: { passed: true },
        resolution: { passed: true },
        fps: { passed: true },
        blankFrames: { passed: true },
        fontRendering: { passed: true },
        duration: { passed: true },
      },
    });

    const result = await runPipeline({ skipDeterminism: true });

    expect(result).toHaveProperty('renderCompleted');
    expect(result).toHaveProperty('validationPassed');
    expect(result).toHaveProperty('galleryGenerated');
    expect(result).toHaveProperty('determinismChecked');
    expect(result).toHaveProperty('outputPaths');
    expect(result.outputPaths).toHaveProperty('video');
    expect(result.outputPaths).toHaveProperty('gallery');
    expect(result.outputPaths).toHaveProperty('validationReport');
  });

  it('stops on validation failure but still generates gallery', async () => {
    vi.mocked(validateRender).mockResolvedValue({
      passed: false,
      timestamp: '2026-05-13T00:00:00Z',
      checks: {
        fileSize: { passed: false },
        resolution: { passed: true },
        fps: { passed: true },
        blankFrames: { passed: true },
        fontRendering: { passed: true },
        duration: { passed: true },
      },
    });

    const result = await runPipeline({ skipDeterminism: true });

    expect(result.renderCompleted).toBe(true);
    expect(result.validationPassed).toBe(false);
    expect(result.galleryGenerated).toBe(true);
    expect(generateGallery).toHaveBeenCalled();
  });

  it('skips determinism check when skipDeterminism=true', async () => {
    vi.mocked(validateRender).mockResolvedValue({
      passed: true,
      timestamp: '2026-05-13T00:00:00Z',
      checks: {
        fileSize: { passed: true },
        resolution: { passed: true },
        fps: { passed: true },
        blankFrames: { passed: true },
        fontRendering: { passed: true },
        duration: { passed: true },
      },
    });

    const result = await runPipeline({ skipDeterminism: true });

    expect(result.determinismChecked).toBe(false);
    expect(compareAllFrames).not.toHaveBeenCalled();
  });

  it('runs determinism check when referencesDir is provided', async () => {
    vi.mocked(validateRender).mockResolvedValue({
      passed: true,
      timestamp: '2026-05-13T00:00:00Z',
      checks: {
        fileSize: { passed: true },
        resolution: { passed: true },
        fps: { passed: true },
        blankFrames: { passed: true },
        fontRendering: { passed: true },
        duration: { passed: true },
      },
    });

    const result = await runPipeline({ referencesDir: 'test/fixtures' });

    expect(result.determinismChecked).toBe(true);
    expect(compareAllFrames).toHaveBeenCalled();
  });

  it('contains correct output paths', async () => {
    vi.mocked(validateRender).mockResolvedValue({
      passed: true,
      timestamp: '2026-05-13T00:00:00Z',
      checks: {
        fileSize: { passed: true },
        resolution: { passed: true },
        fps: { passed: true },
        blankFrames: { passed: true },
        fontRendering: { passed: true },
        duration: { passed: true },
      },
    });

    const result = await runPipeline({ skipDeterminism: true });

    expect(result.outputPaths.video).toContain('brand-showcase.mp4');
    expect(result.outputPaths.gallery).toContain('index.html');
    expect(result.outputPaths.validationReport).toContain('report.json');
  });
});
