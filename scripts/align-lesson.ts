/**
 * Phase E assembly: turn a planned lesson + its synthesized audio/alignment
 * into the audio-authoritative final lesson.json the renderer consumes.
 *
 * Usage:
 *   npx tsx scripts/align-lesson.ts content/lessons/module-1/lesson.json
 *
 * For each narrated scene it: reads the per-scene word alignment, measures the
 * real audio length, copies the WAV into public/ (so Remotion's staticFile can
 * serve it), attaches narration.words + audioSrc, then replaces the estimated
 * durations with measured ones (timing inversion) and re-validates the schema.
 * The lesson.json is rewritten in place — the authoritative artifact.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { LessonSchema } from '../content/schemas/lesson';
import { lessonToSynthPlan, sceneWavPath, sceneAlignPath } from '../src/lib/tts-adapter';
import { wavDurationSeconds } from '../src/lib/wav';
import { attachNarrationAssets, type NarrationAsset } from '../src/lib/assemble';
import { applyMeasuredTimings } from '../src/lib/timing';

function main(): number {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: tsx scripts/align-lesson.ts <lesson.json | lessonId>');
    return 2;
  }
  // Accept either a path to lesson.json or a bare lesson id (e.g. "module-1").
  const lessonPath = arg.endsWith('.json') ? arg : `content/lessons/${arg}/lesson.json`;

  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));
  const plan = lessonToSynthPlan(lesson);
  if (plan.length === 0) {
    console.error(`No narrated scenes in ${lessonPath}; run synthesize-lesson first.`);
    return 1;
  }

  const assets: Record<string, NarrationAsset> = {};
  const measured: Record<string, number> = {};

  for (const { sceneId } of plan) {
    const wavPath = sceneWavPath(lesson.id, sceneId);
    const alignPath = sceneAlignPath(lesson.id, sceneId);
    if (!existsSync(wavPath) || !existsSync(alignPath)) {
      console.error(`Missing audio/alignment for scene ${sceneId} (${wavPath}). Run synthesize-lesson first.`);
      return 1;
    }

    const words = JSON.parse(readFileSync(alignPath, 'utf-8'));
    const seconds = wavDurationSeconds(readFileSync(wavPath));

    // Copy into public/ so Remotion's staticFile() can serve it at render time.
    const publicRel = posix.join('lessons', lesson.id, 'audio', `scene-${sceneId}.wav`);
    const publicAbs = join('public', publicRel);
    mkdirSync(dirname(publicAbs), { recursive: true });
    copyFileSync(wavPath, publicAbs);

    assets[sceneId] = { audioSrc: publicRel, words };
    measured[sceneId] = seconds;
  }

  const withAssets = attachNarrationAssets(lesson, assets);
  const final = applyMeasuredTimings(withAssets, measured);

  const parsed = LessonSchema.safeParse(final);
  if (!parsed.success) {
    console.error('Assembled lesson failed LessonSchema validation:');
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    return 1;
  }

  writeFileSync(lessonPath, `${JSON.stringify(final, null, 2)}\n`);

  const fps = 30;
  console.log(`Assembled ${plan.length} narrated scene(s) into ${lessonPath}`);
  console.log(`  estimated duration: ${lesson.lesson.duration} frames (~${(lesson.lesson.duration / fps).toFixed(1)}s)`);
  console.log(`  measured  duration: ${final.lesson.duration} frames (~${(final.lesson.duration / fps).toFixed(1)}s)`);
  return 0;
}

process.exit(main());
