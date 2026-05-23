import type { Lesson, SceneType } from '../../content/schemas/index';
import { FPS, MIN_SECONDS, DEFAULT_MIN_SECONDS } from './scene-planner';

/**
 * Timing inversion (Phase E, design §3.2) — the authoritative pass.
 *
 * The scene-planner produces a PRE-AUDIO estimate from word count. Once real
 * narration audio exists, its measured length drives `duration`: replace each
 * estimate with the measured audio length (ceiled to a frame), keep the
 * per-scene-type minimum floor so a short line never out-paces the reveal
 * animation, then recompute contiguous `start` values and `lesson.duration`.
 *
 * The LessonSchema `superRefine` (contiguity + duration sum) becomes the
 * guarantee this pass must satisfy.
 */

/** Brief settle before/after speech (matches the estimate pass's pad). */
export const SETTLE_SECONDS = 0.6;

/** Measured audio length → on-screen frames, floored by scene type. */
export function framesFromAudioSeconds(
  seconds: number,
  type: SceneType,
  fps: number = FPS,
  settle: number = SETTLE_SECONDS,
): number {
  const floor = MIN_SECONDS[type] ?? DEFAULT_MIN_SECONDS;
  const sec = Math.max(seconds + settle, floor);
  return Math.ceil(sec * fps);
}

export interface TimingOptions {
  fps?: number;
  settle?: number;
}

/**
 * Replace estimated scene durations with measured audio durations (seconds,
 * keyed by scene id), recompute contiguous starts and total duration. Scenes
 * with no measured entry keep their existing estimate. Returns a new lesson;
 * the input is not mutated.
 */
export function applyMeasuredTimings(
  lesson: Lesson,
  measured: Record<string, number>,
  opts: TimingOptions = {},
): Lesson {
  const fps = opts.fps ?? FPS;
  const settle = opts.settle ?? SETTLE_SECONDS;

  let cursor = 0;
  const scenes = lesson.scenes.map((scene) => {
    const m = measured[scene.id];
    const duration =
      m === undefined ? scene.duration : framesFromAudioSeconds(m, scene.type, fps, settle);
    const start = cursor;
    cursor += duration;
    return { ...scene, start, duration };
  });

  return {
    ...lesson,
    scenes,
    lesson: { ...lesson.lesson, duration: cursor },
  };
}
