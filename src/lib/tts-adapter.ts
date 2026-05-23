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
import { join } from 'node:path';

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

/** Per-scene output path. Per-scene granularity = the cache/regeneration unit. */
export function sceneWavPath(lessonId: string, sceneId: string): string {
  return join('content', 'lessons', lessonId, 'audio', `scene-${sceneId}.wav`);
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
