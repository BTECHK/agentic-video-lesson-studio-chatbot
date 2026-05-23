/**
 * Orchestration entry: read a lesson.json, synthesize one WAV per narrated
 * scene via the TTS adapter (Kokoro sidecar by default).
 *
 * Usage:
 *   npx tsx scripts/synthesize-lesson.ts content/lessons/module-1/lesson.json
 *
 * Implementation is selected by the adapter via TTS_IMPL (default kokoro).
 * This script is intentionally thin: all logic lives in src/lib/tts-adapter.ts.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { lessonToSynthPlan, synthesize } from '../src/lib/tts-adapter';

async function main(): Promise<number> {
  const lessonPath = process.argv[2];
  if (!lessonPath) {
    console.error('usage: tsx scripts/synthesize-lesson.ts <lesson.json>');
    return 2;
  }

  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));
  const plan = lessonToSynthPlan(lesson);

  if (plan.length === 0) {
    console.error(`No narrated scenes found in ${lessonPath}.`);
    return 1;
  }

  console.log(`Synthesizing ${plan.length} scene(s) from ${lessonPath}...`);
  for (const item of plan) {
    mkdirSync(dirname(item.wavPath), { recursive: true });
    const { wavPath } = await synthesize(item.text, undefined, item.wavPath);
    console.log(`  scene-${item.sceneId} -> ${wavPath}`);
  }
  console.log('Done.');
  return 0;
}

main().then((code) => process.exit(code));
