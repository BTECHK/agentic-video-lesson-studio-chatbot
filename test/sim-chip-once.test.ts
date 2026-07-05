import { describe, it, expect } from 'vitest';
import { firstSimSceneIndex } from '../src/compositions/LessonVideo';

// AC9 (G3): the "Stylized simulation" honesty chip shows once per lesson — on
// the FIRST sim scene only. `firstSimSceneIndex` is the pure seam LessonVideo
// uses to set `showSimDisclaimer: index === firstSimIndex` per scene. These are
// pure-function tests: the repo has no component-render harness for scenes
// (Remotion scenes render via the batch renderer, not vitest), so behavior is
// proven at the index computation the render path consumes.
describe('firstSimSceneIndex (sim chip once per lesson)', () => {
  it('returns the index of the first sim among non-sim scenes', () => {
    const scenes = [
      { type: 'topic-cover' },
      { type: 'framework' },
      { type: 'comparison-chats' },
      { type: 'tool-demo' },
      { type: 'voice-demo' },
    ];
    expect(firstSimSceneIndex(scenes)).toBe(2);
    // Only that first sim scene gets the prop; later sims are false.
    expect(scenes.map((_, i) => i === firstSimSceneIndex(scenes))).toEqual([
      false,
      false,
      true,
      false,
      false,
    ]);
  });

  it('returns -1 when the lesson has no sim scenes', () => {
    const scenes = [{ type: 'topic-cover' }, { type: 'framework' }, { type: 'quote-card' }];
    expect(firstSimSceneIndex(scenes)).toBe(-1);
  });

  it('returns 0 when the first scene is itself a sim scene', () => {
    const scenes = [{ type: 'screen-flow' }, { type: 'tool-demo' }, { type: 'comparison-chats' }];
    expect(firstSimSceneIndex(scenes)).toBe(0);
  });

  it('recognizes each of the four sim scene types', () => {
    for (const type of ['comparison-chats', 'tool-demo', 'screen-flow', 'voice-demo']) {
      expect(firstSimSceneIndex([{ type: 'framework' }, { type }])).toBe(1);
    }
  });
});
