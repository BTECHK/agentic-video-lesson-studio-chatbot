import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildLessonNodes, runLessonRegen, type RegenRunners } from '../src/lib/regen-graph';
import { runDag, type CacheState } from '../src/lib/build-dag';

const LESSON_ID = 'test-lesson';

let root: string;
let calls: string[];

/** Lesson dir under the temp root. */
const lessonDir = () => join(root, 'content', 'lessons', LESSON_ID);

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/** Two narrated scenes + one silent scene (silent has no narration → no audio node). */
function seedLesson(narrationA = 'Hello from scene a.'): void {
  writeJson(join(lessonDir(), 'outline.json'), { id: LESSON_ID, sections: [] });
  writeJson(join(lessonDir(), 'script.json'), { id: LESSON_ID, blocks: [] });
  writeJson(join(lessonDir(), 'lesson.json'), {
    id: LESSON_ID,
    lesson: { duration: 100 },
    scenes: [
      { id: 'a', type: 'cover', narration: { text: narrationA } },
      { id: 'b', type: 'recap-grid', narration: { text: 'Hello from scene b.' } },
      { id: 'c', type: 'quote-card' },
    ],
  });
}

/**
 * Fake runners that record their calls and write the outputs a real run would,
 * so the content-hash cascade is exercised end-to-end without docker/remotion.
 */
function fakeRunners(): RegenRunners {
  return {
    plan: async () => {
      calls.push('plan');
      // Real plan writes lesson.json; here the fixture already has it — leave it.
    },
    tts: async (lessonId, sceneId) => {
      calls.push(`tts:${sceneId}`);
      const lesson = JSON.parse(readFileSync(join(lessonDir(), 'lesson.json'), 'utf-8'));
      const scene = lesson.scenes.find((s: { id: string }) => s.id === sceneId);
      const audioDir = join(lessonDir(), 'audio');
      const alignDir = join(lessonDir(), 'align');
      mkdirSync(audioDir, { recursive: true });
      mkdirSync(alignDir, { recursive: true });
      // Output depends on the narration text → editing text changes the wav.
      writeFileSync(join(audioDir, `scene-${sceneId}.wav`), `wav:${scene.narration.text}`);
      writeFileSync(join(alignDir, `scene-${sceneId}.json`), `align:${scene.narration.text}`);
    },
    align: async () => {
      calls.push('align');
      // Real align rewrites lesson.json from the measured audio; mirror that the
      // file changes (so render, which reads lesson.json, sees an input change).
      const p = join(lessonDir(), 'lesson.json');
      const lesson = JSON.parse(readFileSync(p, 'utf-8'));
      const wavA = readFileSync(join(lessonDir(), 'audio', 'scene-a.wav'), 'utf-8');
      const wavB = readFileSync(join(lessonDir(), 'audio', 'scene-b.wav'), 'utf-8');
      lesson.lesson.duration = (wavA + wavB).length; // deterministic fn of audio
      writeFileSync(p, JSON.stringify(lesson, null, 2));
    },
    render: async (_lessonId, outPath) => {
      calls.push('render');
      mkdirSync(join(outPath, '..'), { recursive: true });
      writeFileSync(outPath, 'mp4');
    },
  };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'regen-'));
  calls = [];
  seedLesson();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('buildLessonNodes', () => {
  it('emits plan, one tts node per narrated scene, align, and render', () => {
    const nodes = buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() });
    const ids = nodes.map((n) => n.id).sort();
    expect(ids).toEqual(['align', 'plan', 'render', 'tts:a', 'tts:b']);
  });

  it('wires align to depend on plan and every tts node', () => {
    const nodes = buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() });
    const align = nodes.find((n) => n.id === 'align')!;
    expect(align.deps.sort()).toEqual(['plan', 'tts:a', 'tts:b']);
  });
});

describe('regenerate (end to end over the temp fixture)', () => {
  it('builds the whole lesson on a cold cache, in dependency order', async () => {
    const cache: CacheState = {};
    const out = await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), { cache });

    expect(out.every((o) => o.status === 'rebuilt')).toBe(true);
    expect(calls[0]).toBe('plan');
    expect(calls.indexOf('align')).toBeGreaterThan(calls.indexOf('tts:a'));
    expect(calls.indexOf('align')).toBeGreaterThan(calls.indexOf('tts:b'));
    expect(calls.at(-1)).toBe('render');
    expect(existsSync(join(root, 'out', `${LESSON_ID}.mp4`))).toBe(true);
  });

  it('rebuilds nothing on a second run when no input changed', async () => {
    const cache: CacheState = {};
    await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), { cache });
    calls = [];
    const out = await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), { cache });

    expect(out.every((o) => o.status === 'fresh')).toBe(true);
    expect(calls).toEqual([]);
  });

  it('regenerates only the edited scene plus align + render when one narration changes', async () => {
    const cache: CacheState = {};
    await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), { cache });

    // Edit scene a's narration only; rebuild the graph from the updated lesson.json.
    seedLesson('Completely different narration for scene a.');
    calls = [];
    const out = await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), { cache });

    const byId = Object.fromEntries(out.map((o) => [o.id, o.status]));
    expect(byId).toEqual({
      plan: 'fresh',
      'tts:a': 'rebuilt',
      'tts:b': 'fresh',
      align: 'rebuilt',
      render: 'rebuilt',
    });
    expect(calls).toEqual(['tts:a', 'align', 'render']);
  });

  it('dry run reports a full cold rebuild without invoking any runner', async () => {
    const cache: CacheState = {};
    const out = await runDag(buildLessonNodes(LESSON_ID, { root, runners: fakeRunners() }), {
      cache,
      dryRun: true,
    });

    expect(out.every((o) => o.status === 'rebuilt')).toBe(true);
    expect(calls).toEqual([]);
    expect(cache).toEqual({});
  });
});

describe('runLessonRegen (two-pass: plan first, then nodes from the planned lesson.json)', () => {
  /** Plan runner that rewrites lesson.json — the structural change the single-pass
   * build missed (scene-set edits) and hashed stale (narration edits). */
  function structuralRunners(newScenes: { id: string; type: string; narration?: { text: string } }[]): RegenRunners {
    const base = fakeRunners();
    return {
      ...base,
      plan: async () => {
        calls.push('plan');
        const p = join(lessonDir(), 'lesson.json');
        const lesson = JSON.parse(readFileSync(p, 'utf-8'));
        lesson.scenes = newScenes;
        writeFileSync(p, JSON.stringify(lesson, null, 2));
      },
      // align in fakeRunners hardcodes scenes a+b; make it scene-agnostic here.
      align: async () => {
        calls.push('align');
        const p = join(lessonDir(), 'lesson.json');
        const lesson = JSON.parse(readFileSync(p, 'utf-8'));
        lesson.lesson.duration = calls.length; // any deterministic change
        writeFileSync(p, JSON.stringify(lesson, null, 2));
      },
    };
  }

  it('picks up scenes ADDED/REMOVED by plan in the same pass (no missing-node errors)', async () => {
    // Old lesson.json has scenes a+b; the new plan output replaces b with d.
    const runners = structuralRunners([
      { id: 'a', type: 'cover', narration: { text: 'Hello from scene a.' } },
      { id: 'd', type: 'tool-demo', narration: { text: 'Brand new scene d.' } },
    ]);
    // Make plan stale: change script.json (a plan input).
    writeJson(join(lessonDir(), 'script.json'), { id: LESSON_ID, blocks: [{ id: 'd' }] });

    const cache: CacheState = {};
    const out = await runLessonRegen(LESSON_ID, { root, runners, cache });

    const ids = out.map((o) => o.id);
    expect(ids).toContain('tts:d'); // new scene got a node
    expect(ids).not.toContain('tts:b'); // removed scene no longer errors
    expect(out.every((o) => o.status !== 'error' && o.status !== 'skipped')).toBe(true);
    expect(calls).toContain('tts:d');
    expect(existsSync(join(lessonDir(), 'audio', 'scene-d.wav'))).toBe(true);
  });

  it('resynthesizes audio for a narration edit in ONE pass (stale-TTS bug)', async () => {
    // Cold build with the original narration.
    const runners1 = structuralRunners([
      { id: 'a', type: 'cover', narration: { text: 'Hello from scene a.' } },
    ]);
    const cache: CacheState = {};
    await runLessonRegen(LESSON_ID, { root, runners: runners1, cache });

    // Edit the script (plan input) so plan rewrites scene a with NEW narration.
    writeJson(join(lessonDir(), 'script.json'), { id: LESSON_ID, blocks: [{ id: 'a', v: 2 }] });
    const runners2 = structuralRunners([
      { id: 'a', type: 'cover', narration: { text: 'Edited narration for scene a.' } },
    ]);
    calls = [];
    await runLessonRegen(LESSON_ID, { root, runners: runners2, cache });

    // The wav must carry the NEW text in the same pass — no second run needed.
    const wav = readFileSync(join(lessonDir(), 'audio', 'scene-a.wav'), 'utf-8');
    expect(wav).toContain('Edited narration for scene a.');
    expect(calls).toContain('tts:a');
  });

  it('reports plan as rebuilt when it ran in the first pass', async () => {
    const runners = structuralRunners([
      { id: 'a', type: 'cover', narration: { text: 'Hello from scene a.' } },
    ]);
    const cache: CacheState = {};
    const out = await runLessonRegen(LESSON_ID, { root, runners, cache });
    expect(out.find((o) => o.id === 'plan')!.status).toBe('rebuilt');

    // Second run with nothing changed: everything fresh, no runner calls.
    calls = [];
    const out2 = await runLessonRegen(LESSON_ID, { root, runners, cache });
    expect(out2.every((o) => o.status === 'fresh')).toBe(true);
    expect(calls).toEqual([]);
  });
});
