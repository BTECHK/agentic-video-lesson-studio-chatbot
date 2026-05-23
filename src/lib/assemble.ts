import type { Lesson, NarrationWord } from '../../content/schemas/lesson';

/**
 * Assembly (Phase E) — attach synthesized audio + word alignment to a lesson's
 * narration, the bridge between the TTS/aligner artifacts and the renderer.
 *
 * `audioSrc` is a `staticFile`-relative path (under public/) so the LessonVideo
 * composition can play `<Audio src={staticFile(narration.audioSrc)}>`. Returns
 * a new lesson; the input is not mutated. Timing inversion is applied
 * separately by `applyMeasuredTimings`.
 */

export interface NarrationAsset {
  audioSrc: string;
  words: NarrationWord[];
}

export function attachNarrationAssets(
  lesson: Lesson,
  assets: Record<string, NarrationAsset>,
): Lesson {
  const scenes = lesson.scenes.map((scene) => {
    const asset = assets[scene.id];
    if (!asset || !scene.narration) return scene;
    return {
      ...scene,
      narration: {
        ...scene.narration,
        audioSrc: asset.audioSrc,
        words: asset.words,
      },
    };
  });
  return { ...lesson, scenes };
}
