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
import { runMain, type Logger } from '../src/lib/logger';

async function main(log: Logger): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    log.error('usage: tsx scripts/synthesize-lesson.ts <lesson.json | lessonId>');
    return 2;
  }
  // Accept either a path to lesson.json or a bare lesson id (e.g. "module-1").
  const lessonPath = arg.endsWith('.json') ? arg : `content/lessons/${arg}/lesson.json`;

  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));
  const { manifestPath, entries } = buildManifest(lesson);

  if (entries.length === 0) {
    log.error('no narrated scenes found', { lessonPath });
    return 1;
  }

  const impl = selectImpl(process.env);
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(entries, null, 2));

  log.info('synthesizing scenes', { lessonPath, scenes: entries.length, impl });
  await defaultBatchRunner({ manifestPath, voice: TTS_DEFAULT_VOICE, impl });
  log.info('synthesis complete', { scenes: entries.length });
  return 0;
}

runMain('tts', main);
