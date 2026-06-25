import { describe, it, expect, beforeEach } from 'vitest';
import { SCENE_TYPES } from '../src/lib/scene-types';
import { registerLessonScenes } from '../src/compositions/lesson-scenes/register';
import {
  getSceneComponent,
  getRegisteredTypes,
  clearRegistry,
} from '../src/lib/scene-dispatcher';

describe('registerLessonScenes', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers a component for all 18 scene types', () => {
    registerLessonScenes();
    for (const type of SCENE_TYPES) {
      expect(getSceneComponent(type), `missing component for ${type}`).not.toBeNull();
    }
    expect(getRegisteredTypes()).toHaveLength(18);
  });

  it('is idempotent across repeated calls (HMR / multiple test imports)', () => {
    registerLessonScenes();
    registerLessonScenes();
    expect(getRegisteredTypes()).toHaveLength(18);
  });
});
