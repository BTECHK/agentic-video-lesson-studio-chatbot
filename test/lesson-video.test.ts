import { describe, it, expect } from 'vitest';
import lessonData from '../content/lessons/module-1/lesson.json';
import { getSceneComponent, clearRegistry } from '../src/lib/scene-dispatcher';
import { registerLessonScenes } from '../src/compositions/lesson-scenes/register';
import { lessonMetadata } from '../src/compositions/LessonVideo';
import { LessonSchema } from '../content/schemas/lesson';

describe('lesson scene registry', () => {
  it('registers a component for every scene type used in module-1', () => {
    clearRegistry();
    registerLessonScenes();
    const usedTypes = [...new Set(lessonData.scenes.map((s) => s.type))];
    for (const type of usedTypes) {
      expect(getSceneComponent(type), `no component for "${type}"`).not.toBeNull();
    }
  });

  it('is idempotent — registering twice does not throw', () => {
    clearRegistry();
    registerLessonScenes();
    expect(() => registerLessonScenes()).not.toThrow();
  });
});

describe('lessonMetadata (calculateMetadata)', () => {
  it('derives durationInFrames from the lesson contiguous timeline', async () => {
    const parsed = LessonSchema.parse(lessonData);
    const meta = await lessonMetadata({
      props: { lesson: parsed },
      // unused fields of the Remotion calculateMetadata arg
      abortSignal: new AbortController().signal,
      defaultProps: { lesson: parsed },
      compositionId: 'LessonVideo',
    } as never);

    expect(meta.durationInFrames).toBe(7462);
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.fps).toBe(30);
  });
});
