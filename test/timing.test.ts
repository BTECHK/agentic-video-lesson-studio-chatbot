import { describe, it, expect } from 'vitest';
import { framesFromAudioSeconds, applyMeasuredTimings } from '../src/lib/timing';
import { LessonSchema, type Lesson } from '../content/schemas/lesson';
import { FPS } from '../src/lib/scene-planner';

/** Minimal two-scene lesson with estimated durations, for timing-inversion tests. */
function makeLesson(): Lesson {
  return {
    schemaVersion: '1.0',
    id: 'test',
    lesson: { title: 'T', topic: 'X', module: 'M', duration: 300 },
    scenes: [
      {
        id: 'a',
        type: 'cover',
        start: 0,
        duration: 120,
        content: { eyebrow: 'M', title: ['Hi'], sub: 'sub' },
        narration: { text: 'one two three' },
      },
      {
        id: 'b',
        type: 'preview-band',
        start: 120,
        duration: 180,
        content: { eyebrow: 'M', title: 'Hi' },
        narration: { text: 'four five' },
      },
    ],
    meta: { createdAt: '2026-05-23', lastUpdated: '2026-05-23', authors: ['x'], factCheckedAt: null },
  } as Lesson;
}

describe('framesFromAudioSeconds', () => {
  it('floors audio shorter than the scene-type minimum (cover floor = 4s)', () => {
    // 1s of audio is shorter than cover's 4s floor → floor wins.
    expect(framesFromAudioSeconds(1, 'cover')).toBe(4 * FPS);
  });

  it('uses measured length plus settle pad, ceiled to a frame, above the floor', () => {
    // 10s audio + 0.6s settle = 10.6s → ceil(10.6 * 30) = 318 frames.
    expect(framesFromAudioSeconds(10, 'cover')).toBe(318);
  });
});

describe('applyMeasuredTimings', () => {
  it('replaces durations with measured audio and keeps the timeline contiguous + schema-valid', () => {
    const lesson = makeLesson();
    const result = applyMeasuredTimings(lesson, { a: 10, b: 8 });

    const aFrames = framesFromAudioSeconds(10, 'cover');
    const bFrames = framesFromAudioSeconds(8, 'preview-band');

    expect(result.scenes[0].duration).toBe(aFrames);
    expect(result.scenes[0].start).toBe(0);
    expect(result.scenes[1].duration).toBe(bFrames);
    expect(result.scenes[1].start).toBe(aFrames);
    expect(result.lesson.duration).toBe(aFrames + bFrames);

    // The authoritative pass must still satisfy the LessonSchema contract.
    expect(() => LessonSchema.parse(result)).not.toThrow();
  });

  it('keeps the existing estimate for scenes with no measured audio', () => {
    const lesson = makeLesson();
    const result = applyMeasuredTimings(lesson, { a: 10 });
    expect(result.scenes[1].duration).toBe(180); // unchanged estimate
    expect(result.scenes[1].start).toBe(result.scenes[0].duration);
  });
});
