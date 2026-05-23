/**
 * Orchestration entry: read a lesson.json, synthesize one WAV per narrated
 * scene via the TTS adapter (Kokoro sidecar by default).
 *
 * Usage:
 *   npx tsx scripts/synthesize-lesson.ts content/lessons/module-1/lesson.json
 *
 * All scenes are synthesized in a SINGLE container run (the Kokoro model loads
 * once) via a manifest — faster and more reliable than one container per scene.
 * Implementation is selected by the adapter via TTS_IMPL (default kokoro).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  buildManifest,
  selectImpl,
  defaultBatchRunner,
  TTS_DEFAULT_VOICE,
} from '../src/lib/tts-adapter';

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: tsx scripts/synthesize-lesson.ts <lesson.json | lessonId>');
    return 2;
  }
  // Accept either a path to lesson.json or a bare lesson id (e.g. "module-1").
  const lessonPath = arg.endsWith('.json') ? arg : `content/lessons/${arg}/lesson.json`;

  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));
  const { manifestPath, entries } = buildManifest(lesson);

  if (entries.length === 0) {
    console.error(`No narrated scenes found in ${lessonPath}.`);
    return 1;
  }

  const impl = selectImpl(process.env);
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(entries, null, 2));

  console.log(`Synthesizing ${entries.length} scene(s) from ${lessonPath} (impl=${impl})...`);
  await defaultBatchRunner({ manifestPath, voice: TTS_DEFAULT_VOICE, impl });
  console.log('Done.');
  return 0;
}

main().then((code) => process.exit(code));
