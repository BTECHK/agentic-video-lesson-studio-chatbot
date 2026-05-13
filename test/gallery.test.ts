import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { generateGallery } from '../scripts/gallery';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('Gallery Generator', () => {
  const scenes = [
    {
      name: 'typography',
      frames: [
        { frameNumber: 0, filename: 'typography-frame-0.png' },
        { frameNumber: 45, filename: 'typography-frame-45.png' },
        { frameNumber: 89, filename: 'typography-frame-89.png' },
      ],
    },
    {
      name: 'brand-elements',
      frames: [
        { frameNumber: 90, filename: 'brand-elements-frame-90.png' },
        { frameNumber: 135, filename: 'brand-elements-frame-135.png' },
        { frameNumber: 179, filename: 'brand-elements-frame-179.png' },
      ],
    },
    {
      name: 'motion-test',
      frames: [
        { frameNumber: 180, filename: 'motion-test-frame-180.png' },
        { frameNumber: 240, filename: 'motion-test-frame-240.png' },
        { frameNumber: 299, filename: 'motion-test-frame-299.png' },
      ],
    },
  ];

  const validationReport = {
    passed: true,
    timestamp: '2026-05-13T00:00:00Z',
    checks: {
      fileSize: { passed: true },
      resolution: { passed: true, width: 1920, height: 1080 },
      fps: { passed: true, value: 30 },
      blankFrames: { passed: true, blankCount: 0, totalChecked: 9 },
      fontRendering: { passed: true },
      duration: { passed: true },
    },
  };

  it('produces valid HTML with DOCTYPE', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('contains all scene names', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('typography');
    expect(html).toContain('brand-elements');
    expect(html).toContain('motion-test');
  });

  it('contains img tags referencing screenshot filenames', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('<img');
    expect(html).toContain('typography-frame-0.png');
    expect(html).toContain('brand-elements-frame-135.png');
    expect(html).toContain('motion-test-frame-299.png');
  });

  it('includes validation report data', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('passed');
    expect(html).toContain('fileSize');
  });

  it('includes storyboard placeholder for VERI-03 extensibility', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('data-storyboard="placeholder"');
  });

  it('contains scene and frame CSS classes', () => {
    const html = generateGallery(scenes, validationReport);
    expect(html).toContain('class="scene"');
    expect(html).toContain('class="frame"');
  });

  it('handles null validation report', () => {
    const html = generateGallery(scenes, null);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('typography');
  });
});
