import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { SCENE_TYPES, type SceneComponentProps } from '../src/lib/scene-types';
import {
  registerSceneComponent,
  getSceneComponent,
  getRegisteredTypes,
  clearRegistry,
} from '../src/lib/scene-dispatcher';
import { validateLesson, validateToolData } from '../src/lib/content-loader';
import { CAPABILITY_CATEGORIES } from '../content/schemas';

const MockComponent: React.FC<SceneComponentProps> = () => null;

// --- Scene Types ---

describe('SceneTypes', () => {
  it('has exactly 17 scene type entries', () => {
    expect(SCENE_TYPES).toHaveLength(17);
  });

  it('includes cover, journey-map, quote-card, tool-demo, and screen-flow', () => {
    expect(SCENE_TYPES).toContain('cover');
    expect(SCENE_TYPES).toContain('journey-map');
    expect(SCENE_TYPES).toContain('quote-card');
    expect(SCENE_TYPES).toContain('tool-demo');
    expect(SCENE_TYPES).toContain('screen-flow');
  });
});

// --- Scene Dispatcher ---

describe('SceneDispatcher', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers and retrieves a scene component', () => {
    registerSceneComponent('cover', MockComponent);
    const result = getSceneComponent('cover');
    expect(result).toBe(MockComponent);
  });

  it('returns null for unregistered type', () => {
    const result = getSceneComponent('cover');
    expect(result).toBeNull();
  });

  it('returns null for invalid type string', () => {
    const result = getSceneComponent('not-a-type');
    expect(result).toBeNull();
  });

  it('throws on duplicate registration', () => {
    registerSceneComponent('cover', MockComponent);
    expect(() => registerSceneComponent('cover', MockComponent)).toThrow(
      'Scene component already registered for type: cover',
    );
  });

  it('returns empty array when nothing registered', () => {
    expect(getRegisteredTypes()).toEqual([]);
  });

  it('returns registered types after registration', () => {
    registerSceneComponent('cover', MockComponent);
    registerSceneComponent('recap-grid', MockComponent);
    const types = getRegisteredTypes();
    expect(types).toContain('cover');
    expect(types).toContain('recap-grid');
    expect(types).toHaveLength(2);
  });
});

// --- Content Loader: validateLesson ---

describe('validateLesson', () => {
  it('returns success false for empty object', () => {
    const result = validateLesson({});
    expect(result.success).toBe(false);
  });

  it('returns success false for wrong schemaVersion', () => {
    const result = validateLesson({
      schemaVersion: '2.0',
      id: 'test',
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 8 },
      scenes: [{ id: 's1', type: 'cover', start: 0, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } }],
      meta: { createdAt: '2026-01-01', lastUpdated: '2026-01-01', authors: ['A'], factCheckedAt: null },
    });
    expect(result.success).toBe(false);
  });

  it('returns success true for valid minimal lesson', () => {
    const result = validateLesson({
      schemaVersion: '1.0',
      id: 'test',
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 8 },
      scenes: [{ id: 's1', type: 'cover', start: 0, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } }],
      meta: { createdAt: '2026-01-01', lastUpdated: '2026-01-01', authors: ['Test'], factCheckedAt: null },
    });
    expect(result.success).toBe(true);
  });

  it('returns success false for timing gap', () => {
    const result = validateLesson({
      schemaVersion: '1.0',
      id: 'test',
      lesson: { title: 'T', topic: 'T1', module: 'M1', duration: 15 },
      scenes: [
        { id: 's1', type: 'cover', start: 1, duration: 8, content: { eyebrow: 'E', title: ['T'], sub: 'S' } },
      ],
      meta: { createdAt: '2026-01-01', lastUpdated: '2026-01-01', authors: ['A'], factCheckedAt: null },
    });
    expect(result.success).toBe(false);
  });
});

// --- Content Loader: validateToolData ---

describe('validateToolData', () => {
  it('returns success false for empty object', () => {
    const result = validateToolData({});
    expect(result.success).toBe(false);
  });

  it('returns success true for valid minimal tool', () => {
    const capabilities: Record<string, unknown> = {};
    for (const cat of CAPABILITY_CATEGORIES) {
      capabilities[cat] = {
        category: cat,
        supported: true,
        summary: 'Test',
        subFeatures: [{ name: 'F', description: 'D' }],
        limitations: [],
        pricingTiers: [{ tier: 'Free', details: 'Basic' }],
        versionHistory: [{ version: '1.0', date: '2024-01', changes: 'Init' }],
      };
    }
    const result = validateToolData({
      id: 'test',
      name: 'Test',
      vendor: 'V',
      productId: 'test',
      surface: 'Web app',
      isPrimarySurface: true,
      priority: 'P0',
      description: 'D',
      url: 'https://example.com',
      capabilities,
      sourceRefs: ['s1'],
    });
    expect(result.success).toBe(true);
  });
});
