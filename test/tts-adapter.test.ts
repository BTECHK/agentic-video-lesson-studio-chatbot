import { describe, it, expect, vi } from 'vitest';
import {
  selectImpl,
  sceneWavPath,
  lessonToSynthPlan,
  synthesize,
  buildManifest,
  TTS_DEFAULT_VOICE,
  type SidecarRunner,
} from '../src/lib/tts-adapter';

// --- Helper factory: a minimal lesson-like object ---

function makeLesson(scenes: Array<{ id: string } & Record<string, unknown>>) {
  return { id: 'module-1', scenes };
}

// --- selectImpl: env-driven implementation selection ---

describe('selectImpl', () => {
  it('defaults to kokoro when nothing is set', () => {
    expect(selectImpl({})).toBe('kokoro');
  });

  it('honors TTS_IMPL=chatterbox', () => {
    expect(selectImpl({ TTS_IMPL: 'chatterbox' })).toBe('chatterbox');
  });

  it('honors TTS_IMPL=kokoro explicitly', () => {
    expect(selectImpl({ TTS_IMPL: 'kokoro' })).toBe('kokoro');
  });

  it('throws on an unknown impl', () => {
    expect(() => selectImpl({ TTS_IMPL: 'bogus' })).toThrow(/unknown.*tts/i);
  });

  it('allows paid only when the paid api key is present', () => {
    expect(selectImpl({ TTS_IMPL: 'paid', TTS_PAID_API_KEY: 'sk-xxx' })).toBe('paid');
  });

  it('rejects paid when no paid api key is set (inert by default)', () => {
    expect(() => selectImpl({ TTS_IMPL: 'paid' })).toThrow(/api key/i);
  });
});

// --- sceneWavPath: per-scene output path convention ---

describe('sceneWavPath', () => {
  it('builds content/lessons/<lessonId>/audio/scene-<sceneId>.wav', () => {
    const p = sceneWavPath('module-1', 'cover');
    expect(p.replace(/\\/g, '/')).toBe('content/lessons/module-1/audio/scene-cover.wav');
  });

  it('produces a distinct path per scene (cache unit)', () => {
    const a = sceneWavPath('module-1', 'cover');
    const b = sceneWavPath('module-1', 'recap');
    expect(a).not.toBe(b);
  });

  it('uses posix separators so the path is valid inside the linux container', () => {
    // The path is passed verbatim to the Linux TTS container; backslashes
    // (Windows path.join) would make it a literal filename, not a dir path.
    expect(sceneWavPath('module-1', 'cover')).toBe(
      'content/lessons/module-1/audio/scene-cover.wav',
    );
  });
});

// --- buildManifest: batch all narrated scenes into one container run ---

describe('buildManifest', () => {
  it('maps narrated scenes to {text,out} entries with posix paths plus a manifest path', () => {
    const lesson = makeLesson([
      { id: 'cover', narration: { text: 'Welcome.' } },
      { id: 'silent', content: {} },
      { id: 'recap', narration: { text: 'Done.' } },
    ]);
    const { manifestPath, entries } = buildManifest(lesson);
    expect(manifestPath).toBe('content/lessons/module-1/audio/manifest.json');
    expect(entries).toEqual([
      {
        text: 'Welcome.',
        out: 'content/lessons/module-1/audio/scene-cover.wav',
        align: 'content/lessons/module-1/align/scene-cover.json',
      },
      {
        text: 'Done.',
        out: 'content/lessons/module-1/audio/scene-recap.wav',
        align: 'content/lessons/module-1/align/scene-recap.json',
      },
    ]);
  });
});

// --- lessonToSynthPlan: lesson -> per-scene narration + path mapping ---

describe('lessonToSynthPlan', () => {
  it('maps each narrated scene to its text and per-scene wav path', () => {
    const lesson = makeLesson([
      { id: 'cover', narration: { text: 'Welcome to the lesson.' } },
      { id: 'recap', narration: { text: 'That is a wrap.' } },
    ]);
    const plan = lessonToSynthPlan(lesson);
    expect(plan).toHaveLength(2);
    expect(plan[0]).toMatchObject({ sceneId: 'cover', text: 'Welcome to the lesson.' });
    expect(plan[0].wavPath.replace(/\\/g, '/')).toBe(
      'content/lessons/module-1/audio/scene-cover.wav',
    );
    expect(plan[1].sceneId).toBe('recap');
  });

  it('also reads narration nested under scene.content.narration', () => {
    const lesson = makeLesson([
      { id: 'cover', content: { narration: { text: 'From content.' } } },
    ]);
    const plan = lessonToSynthPlan(lesson);
    expect(plan).toHaveLength(1);
    expect(plan[0].text).toBe('From content.');
  });

  it('skips scenes that have no narration text', () => {
    const lesson = makeLesson([
      { id: 'cover', narration: { text: 'Has narration.' } },
      { id: 'silent', content: {} },
      { id: 'empty', narration: { text: '   ' } },
    ]);
    const plan = lessonToSynthPlan(lesson);
    expect(plan).toHaveLength(1);
    expect(plan[0].sceneId).toBe('cover');
  });
});

// --- synthesize: orchestrates impl selection + sidecar call ---

describe('synthesize', () => {
  it('rejects empty text without invoking the sidecar', async () => {
    const runner = vi.fn<SidecarRunner>();
    await expect(
      synthesize('   ', TTS_DEFAULT_VOICE, '/tmp/out.wav', { env: {}, runner }),
    ).rejects.toThrow(/empty/i);
    expect(runner).not.toHaveBeenCalled();
  });

  it('calls the sidecar with text, voice, impl, and out path; returns wavPath', async () => {
    const runner = vi.fn<SidecarRunner>().mockResolvedValue(undefined);
    const result = await synthesize('Hello world', 'af_heart', '/tmp/out.wav', {
      env: {},
      runner,
    });
    expect(result).toEqual({ wavPath: '/tmp/out.wav' });
    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner).toHaveBeenCalledWith({
      text: 'Hello world',
      voice: 'af_heart',
      outPath: '/tmp/out.wav',
      impl: 'kokoro',
    });
  });

  it('passes the selected impl through to the sidecar', async () => {
    const runner = vi.fn<SidecarRunner>().mockResolvedValue(undefined);
    await synthesize('Hi', 'af_heart', '/tmp/out.wav', {
      env: { TTS_IMPL: 'chatterbox' },
      runner,
    });
    expect(runner).toHaveBeenCalledWith(
      expect.objectContaining({ impl: 'chatterbox' }),
    );
  });

  it('propagates sidecar failures rather than fabricating success', async () => {
    const runner = vi.fn<SidecarRunner>().mockRejectedValue(new Error('sidecar exit 1'));
    await expect(
      synthesize('Hello', 'af_heart', '/tmp/out.wav', { env: {}, runner }),
    ).rejects.toThrow(/sidecar exit 1/);
  });

  it('uses a default branded neutral voice when none is given', async () => {
    const runner = vi.fn<SidecarRunner>().mockResolvedValue(undefined);
    await synthesize('Hello', undefined, '/tmp/out.wav', { env: {}, runner });
    expect(runner).toHaveBeenCalledWith(
      expect.objectContaining({ voice: TTS_DEFAULT_VOICE }),
    );
  });
});
