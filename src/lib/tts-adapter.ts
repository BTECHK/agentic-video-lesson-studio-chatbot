/**
 * TTS adapter — selects a text-to-speech implementation and drives the
 * Python sidecar (docker/tts) to produce one mono WAV per scene.
 *
 * Implementations:
 *   - kokoro      (default) Kokoro-82M, Apache-2.0, branded neutral voice.
 *   - chatterbox  MIT, reserved for a future custom-voice option.
 *   - paid        ElevenLabs/OpenAI — INERT unless TTS_PAID_API_KEY is set.
 *
 * The adapter contains only pure orchestration logic. The actual sidecar
 * invocation is injected (SidecarRunner) so it can be unit-tested without a
 * model download or a running container.
 */

import { spawn } from 'node:child_process';
import { posix } from 'node:path';

export const TTS_IMPLS = ['kokoro', 'chatterbox', 'paid'] as const;
export type TtsImpl = (typeof TTS_IMPLS)[number];

/** Kokoro's branded neutral default voice. */
export const TTS_DEFAULT_VOICE = 'af_heart';

export interface SidecarArgs {
  text: string;
  voice: string;
  outPath: string;
  impl: TtsImpl;
}

/** Performs the real synthesis (sidecar/container call). Injectable for tests. */
export type SidecarRunner = (args: SidecarArgs) => Promise<void>;

export interface SynthOptions {
  env?: Record<string, string | undefined>;
  runner?: SidecarRunner;
}

export interface SynthPlanItem {
  sceneId: string;
  text: string;
  wavPath: string;
}

/**
 * Choose the TTS implementation from the environment. Defaults to kokoro.
 * The paid slot is gated behind TTS_PAID_API_KEY so it is inert by default.
 */
export function selectImpl(env: Record<string, string | undefined> = {}): TtsImpl {
  const requested = env.TTS_IMPL ?? 'kokoro';
  if (!(TTS_IMPLS as readonly string[]).includes(requested)) {
    throw new Error(
      `Unknown TTS impl "${requested}". Expected one of: ${TTS_IMPLS.join(', ')}`,
    );
  }
  const impl = requested as TtsImpl;
  if (impl === 'paid' && !env.TTS_PAID_API_KEY) {
    throw new Error(
      'TTS impl "paid" requires a paid API key (TTS_PAID_API_KEY) to be set; no paid service is used by default.',
    );
  }
  return impl;
}

/**
 * Per-scene output path. Per-scene granularity = the cache/regeneration unit.
 * POSIX separators: this path is passed verbatim into the Linux TTS container,
 * where Windows backslashes would become a literal filename, not a dir path.
 */
export function sceneWavPath(lessonId: string, sceneId: string): string {
  return posix.join('content', 'lessons', lessonId, 'audio', `scene-${sceneId}.wav`);
}

/** Per-scene word-alignment path (written alongside the wav by the sidecar). */
export function sceneAlignPath(lessonId: string, sceneId: string): string {
  return posix.join('content', 'lessons', lessonId, 'align', `scene-${sceneId}.json`);
}

interface NarrationLike {
  text?: unknown;
}
interface SceneLike {
  id: string;
  narration?: NarrationLike;
  content?: { narration?: NarrationLike } & Record<string, unknown>;
}
interface LessonLike {
  id: string;
  scenes: SceneLike[];
}

/** Read narration text from either scene.narration or scene.content.narration. */
function readNarrationText(scene: SceneLike): string | undefined {
  const candidate = scene.narration?.text ?? scene.content?.narration?.text;
  if (typeof candidate !== 'string') return undefined;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Map a lesson to a synthesis plan: one entry per narrated scene, with its
 * text and target per-scene wav path. Scenes without narration are skipped.
 */
export function lessonToSynthPlan(lesson: LessonLike): SynthPlanItem[] {
  const plan: SynthPlanItem[] = [];
  for (const scene of lesson.scenes) {
    const text = readNarrationText(scene);
    if (text === undefined) continue;
    plan.push({
      sceneId: scene.id,
      text,
      wavPath: sceneWavPath(lesson.id, scene.id),
    });
  }
  return plan;
}

export interface ManifestEntry {
  text: string;
  out: string;
  align: string;
}

export interface Manifest {
  manifestPath: string;
  entries: ManifestEntry[];
}

/**
 * Build a batch synthesis manifest for a whole lesson: one {text, out} entry
 * per narrated scene plus the manifest's own path (all POSIX, container-side).
 *
 * Batching all scenes into a single container run is both faster (the model
 * loads once, not per scene) and far more reliable than spawning one container
 * per scene — repeated container churn destabilizes Docker Desktop on Windows.
 */
export function buildManifest(lesson: LessonLike): Manifest {
  const entries = lessonToSynthPlan(lesson).map((item) => ({
    text: item.text,
    out: item.wavPath,
    align: sceneAlignPath(lesson.id, item.sceneId),
  }));
  return {
    manifestPath: posix.join('content', 'lessons', lesson.id, 'audio', 'manifest.json'),
    entries,
  };
}

export interface BatchArgs {
  manifestPath: string;
  voice: string;
  impl: TtsImpl;
}

/** Performs the real batch synthesis (one container run). Injectable for tests. */
export type BatchRunner = (args: BatchArgs) => Promise<void>;

/**
 * Default batch runner: one `docker compose run` that synthesizes every scene
 * in the manifest in a single container (model loaded once).
 */
export const defaultBatchRunner: BatchRunner = ({ manifestPath, voice, impl }) =>
  new Promise((resolve, reject) => {
    const proc = spawn(
      'docker',
      [
        'compose',
        'run',
        '--rm',
        'tts',
        '--impl',
        impl,
        '--voice',
        voice,
        '--manifest',
        manifestPath,
      ],
      { stdio: 'inherit' },
    );
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`TTS sidecar exited with code ${code}`));
    });
  });

/**
 * Default sidecar runner: invokes the Python TTS CLI inside the docker/tts
 * service via `docker compose run`. Used at runtime; mocked in tests.
 */
const defaultRunner: SidecarRunner = ({ text, voice, outPath, impl }) =>
  new Promise((resolve, reject) => {
    // The tts image's ENTRYPOINT is already `python synthesize.py`, so only the
    // flags are passed here (passing the script again would run it twice).
    const proc = spawn(
      'docker',
      [
        'compose',
        'run',
        '--rm',
        'tts',
        '--impl',
        impl,
        '--voice',
        voice,
        '--out',
        outPath,
        '--text',
        text,
      ],
      { stdio: 'inherit' },
    );
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`TTS sidecar exited with code ${code}`));
    });
  });

/**
 * Synthesize a single scene's narration to a WAV file via the selected impl.
 * Returns the path it wrote (or that the sidecar was told to write).
 */
export async function synthesize(
  text: string,
  voice: string | undefined,
  outPath: string,
  options: SynthOptions = {},
): Promise<{ wavPath: string }> {
  if (text.trim().length === 0) {
    throw new Error('Cannot synthesize empty narration text.');
  }
  const impl = selectImpl(options.env ?? process.env);
  const runner = options.runner ?? defaultRunner;
  await runner({ text, voice: voice ?? TTS_DEFAULT_VOICE, outPath, impl });
  return { wavPath: outPath };
}
