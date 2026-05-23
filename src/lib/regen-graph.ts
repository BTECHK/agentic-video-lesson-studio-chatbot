/**
 * Builds the regeneration DAG for one lesson (FRESH-01/02/03).
 *
 * The deterministic, tool-driven legs of the pipeline:
 *
 *     plan ──▶ tts:<scene> (one per narrated scene) ──▶ align ──▶ render
 *
 * Script generation is intentionally NOT a node: it is a Claude-passthrough step
 * (decision D-02, prompt-only), so the CLI cannot run it autonomously. Instead
 * `script.json` is hashed as an INPUT to `plan` — editing the script (a human +
 * Claude action) makes `plan` stale on the next regenerate, and the change
 * cascades downstream.
 *
 * Per-scene `tts` nodes give per-scene cache granularity: editing one scene's
 * narration resynthesizes only that scene, then `align` re-splices the timing
 * and `render` re-encodes. The node set reflects the CURRENT lesson.json; adding
 * or removing scenes (a structural change via plan) takes effect on the next
 * regenerate pass.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { DagNode } from './build-dag';
import {
  lessonToSynthPlan,
  sceneWavPath,
  sceneAlignPath,
  buildManifest,
  selectImpl,
  defaultBatchRunner,
  TTS_DEFAULT_VOICE,
} from './tts-adapter';

/** The four executable legs. Injected in tests; default impls shell out. */
export interface RegenRunners {
  plan: (lessonId: string) => Promise<void>;
  tts: (lessonId: string, sceneId: string) => Promise<void>;
  align: (lessonId: string) => Promise<void>;
  render: (lessonId: string, outPath: string) => Promise<void>;
}

export interface BuildOptions {
  /** Project root; all artifact paths resolve against it. Defaults to cwd. */
  root?: string;
  runners?: RegenRunners;
}

/** File content, or '' when the file is absent (keeps inputs() total for dry runs). */
function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

/** Content hash of a (possibly binary) file, or '' when absent. */
function hashFile(path: string): string {
  return existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : '';
}

export function buildLessonNodes(lessonId: string, opts: BuildOptions = {}): DagNode[] {
  const root = opts.root ?? process.cwd();
  const runners = opts.runners ?? defaultRunners;
  const abs = (rel: string) => join(root, rel);

  const lessonRel = join('content', 'lessons', lessonId, 'lesson.json');
  const outlineRel = join('content', 'lessons', lessonId, 'outline.json');
  const scriptRel = join('content', 'lessons', lessonId, 'script.json');
  const outPath = abs(join('out', `${lessonId}.mp4`));

  // Narrated scenes drive the per-scene tts nodes. Read from the current
  // lesson.json; empty (no file yet) means only `plan` can run this pass.
  const lessonPath = abs(lessonRel);
  const lesson = existsSync(lessonPath)
    ? JSON.parse(readFileSync(lessonPath, 'utf-8'))
    : { id: lessonId, scenes: [] };
  const narrated = lessonToSynthPlan(lesson);

  const plan: DagNode = {
    id: 'plan',
    deps: [],
    inputs: () => [readText(abs(outlineRel)), readText(abs(scriptRel))],
    output: lessonPath,
    version: 1,
    run: () => runners.plan(lessonId),
  };

  const ttsNodes: DagNode[] = narrated.map(({ sceneId, text }) => ({
    id: `tts:${sceneId}`,
    deps: ['plan'],
    inputs: () => [text],
    output: abs(sceneWavPath(lessonId, sceneId)),
    version: 1,
    run: () => runners.tts(lessonId, sceneId),
  }));

  const align: DagNode = {
    id: 'align',
    deps: ['plan', ...ttsNodes.map((n) => n.id)],
    // Hash the audio + word-timing files (NOT lesson.json, which align rewrites
    // in place — hashing its own output would make it perpetually stale).
    inputs: () =>
      narrated.flatMap(({ sceneId }) => [
        hashFile(abs(sceneWavPath(lessonId, sceneId))),
        hashFile(abs(sceneAlignPath(lessonId, sceneId))),
      ]),
    output: lessonPath,
    version: 1,
    run: () => runners.align(lessonId),
  };

  const render: DagNode = {
    id: 'render',
    deps: ['align'],
    inputs: () => [readText(lessonPath)],
    output: outPath,
    version: 1,
    run: () => runners.render(lessonId, outPath),
  };

  return [plan, ...ttsNodes, align, render];
}

/** Spawn a command, resolving on exit 0 and rejecting otherwise. */
function exec(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    proc.on('error', reject);
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)),
    );
  });
}

/** Real runners: shell out to the same scripts/tools the manual pipeline uses. */
export const defaultRunners: RegenRunners = {
  plan: (lessonId) => exec('npx', ['tsx', 'scripts/plan-lesson.ts', lessonId]),
  tts: async (lessonId, sceneId) => {
    // One-entry manifest = per-scene synth via the proven batch path (the single
    // --out path does NOT emit word alignment; the manifest path does).
    const lesson = JSON.parse(readFileSync(join('content', 'lessons', lessonId, 'lesson.json'), 'utf-8'));
    const item = buildManifest(lesson).entries.find((e) => e.out === sceneWavPath(lessonId, sceneId));
    if (!item) throw new Error(`Scene "${sceneId}" not found in ${lessonId} lesson.json`);
    const manifestPath = sceneAlignPath(lessonId, `${sceneId}-manifest`).replace('.json', '.manifest.json');
    mkdirSync(join('content', 'lessons', lessonId, 'align'), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify([item], null, 2));
    await defaultBatchRunner({ manifestPath, voice: TTS_DEFAULT_VOICE, impl: selectImpl(process.env) });
  },
  align: (lessonId) => exec('npx', ['tsx', 'scripts/align-lesson.ts', lessonId]),
  render: (_lessonId, outPath) => exec('npx', ['remotion', 'render', 'src/index.ts', 'LessonVideo', outPath]),
};
