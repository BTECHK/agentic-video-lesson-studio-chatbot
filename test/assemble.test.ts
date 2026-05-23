import { describe, it, expect } from 'vitest';
import { attachNarrationAssets } from '../src/lib/assemble';
import type { Lesson, NarrationWord } from '../content/schemas/lesson';

function makeLesson(): Lesson {
  return {
    schemaVersion: '1.0',
    id: 'module-1',
    lesson: { title: 'T', topic: 'X', module: 'M', duration: 300 },
    scenes: [
      {
        id: 'a',
        type: 'cover',
        start: 0,
        duration: 120,
        content: { eyebrow: 'M', title: ['Hi'], sub: 'sub' },
        narration: { text: 'one two' },
      },
      {
        id: 'b',
        type: 'preview-band',
        start: 120,
        duration: 180,
        content: { eyebrow: 'M', title: 'Hi' },
        narration: { text: 'three' },
      },
    ],
    meta: { createdAt: '2026-05-23', lastUpdated: '2026-05-23', authors: ['x'], factCheckedAt: null },
  } as Lesson;
}

const WORDS: NarrationWord[] = [
  { word: 'one', startMs: 0, endMs: 400 },
  { word: 'two', startMs: 400, endMs: 800 },
];

describe('attachNarrationAssets', () => {
  it('sets audioSrc and words on the matching scene, preserving narration.text', () => {
    const lesson = makeLesson();
    const result = attachNarrationAssets(lesson, {
      a: { audioSrc: 'lessons/module-1/audio/scene-a.wav', words: WORDS },
    });
    expect(result.scenes[0].narration).toEqual({
      text: 'one two',
      audioSrc: 'lessons/module-1/audio/scene-a.wav',
      words: WORDS,
    });
  });

  it('leaves scenes without provided assets untouched', () => {
    const lesson = makeLesson();
    const result = attachNarrationAssets(lesson, {
      a: { audioSrc: 'x.wav', words: WORDS },
    });
    expect(result.scenes[1].narration).toEqual({ text: 'three' });
  });

  it('does not mutate the input lesson', () => {
    const lesson = makeLesson();
    attachNarrationAssets(lesson, { a: { audioSrc: 'x.wav', words: WORDS } });
    expect(lesson.scenes[0].narration?.audioSrc).toBeUndefined();
  });
});
