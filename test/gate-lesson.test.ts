import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import {
  gatePaths,
  extractGateC,
  extractVerdict,
  framesSensorArgv,
  transcriptSensorArgv,
  buildJudgePrompt,
  runGate,
  type GateDeps,
} from '../src/lib/gate-lesson';

describe('gatePaths', () => {
  it('roots every artifact under the lesson review dir and the mp4 under out/', () => {
    const p = gatePaths('topic-1-lesson-1', '/repo');
    expect(p.mp4).toBe(path.join('/repo', 'out', 'topic-1-lesson-1.mp4'));
    expect(p.reviewDir).toBe(path.join('/repo', 'content', 'lessons', 'topic-1-lesson-1', 'review'));
    expect(p.sensorsDir).toBe(path.join(p.reviewDir, '_sensors'));
    expect(p.framesDir).toBe(path.join(p.sensorsDir, 'frames'));
    expect(p.verdict).toBe(path.join(p.reviewDir, 'watch-gate.md'));
    expect(p.lessonPlan).toBe(path.join('/repo', 'content', 'lessons', 'topic-1-lesson-1', 'lesson-plan.md'));
  });
});

describe('extractGateC', () => {
  it('slices just the Gate C section out of the Definition of Done', () => {
    const dod = [
      '## Gate A — Fidelity', 'a stuff', '',
      '## Gate C — Watch gate', 'the watch checklist', '- [ ] Renders & plays', '',
      '---', '', '## Done =', 'final',
    ].join('\n');
    const c = extractGateC(dod);
    expect(c).toContain('Gate C');
    expect(c).toContain('Renders & plays');
    expect(c).not.toContain('Gate A');
    expect(c).not.toContain('## Done =');
  });
});

describe('extractVerdict', () => {
  it('reads PASS / FIX from the verdict line, case-insensitively', () => {
    expect(extractVerdict('Verdict: PASS\n...')).toBe('PASS');
    expect(extractVerdict('...\nverdict - fix\nmore')).toBe('FIX');
  });
  it('returns UNKNOWN when no verdict token is present', () => {
    expect(extractVerdict('no judgement here')).toBe('UNKNOWN');
  });
});

describe('sensor argv builders', () => {
  it('frames runs watch.py frames-only at legible resolution into the frames dir', () => {
    const argv = framesSensorArgv('out/x.mp4', '/r/frames', 1024, 80);
    expect(argv[0]).toContain('watch.py');
    expect(argv).toContain('--no-whisper');
    expect(argv).toContain('--resolution');
    expect(argv).toContain('1024');
    expect(argv).toContain('--out-dir');
    expect(argv).toContain('/r/frames');
  });
  it('transcript runs gemini-watch.py with the chosen provider', () => {
    const argv = transcriptSensorArgv('out/x.mp4', 'gemini-voice');
    expect(argv[0]).toContain('gemini-watch.py');
    expect(argv).toContain('--provider');
    expect(argv).toContain('gemini-voice');
  });
});

describe('buildJudgePrompt', () => {
  const base = {
    lessonId: 'topic-1-lesson-1',
    gateCChecklist: '## Gate C\n- [ ] Renders & plays',
    lessonPlanMd: '# plan\nthe journey',
    framesReportMd: 'frame: /r/frames/0001.png',
  };

  it('makes Claude the judge, treats the sensor transcript as advisory, and asks for the verdict format', () => {
    const prompt = buildJudgePrompt({ ...base, transcriptReportMd: 'Gemini says: garbled at 1:53' });
    expect(prompt).toMatch(/judge/i);
    expect(prompt).toContain('the journey'); // lesson-plan is in the prompt
    expect(prompt).toContain('Renders & plays'); // checklist is in the prompt
    expect(prompt).toContain('/r/frames/0001.png'); // frame paths to Read
    expect(prompt).toMatch(/advisory/i); // sensor transcript is advisory only
    expect(prompt).toMatch(/PASS|FIX/); // verdict format requested
  });

  it('marks audio checks not-assessed when there is no transcript (frames-only)', () => {
    const prompt = buildJudgePrompt(base);
    expect(prompt).toMatch(/frames-only|no audio|not assessed/i);
    expect(prompt).not.toContain('Gemini says');
  });
});

// --- runGate orchestration (injected deps; no real fs / child_process) ---

function makeDeps(over: Partial<GateDeps> = {}): { deps: GateDeps; writes: Record<string, string>; pyCalls: string[][] } {
  const writes: Record<string, string> = {};
  const pyCalls: string[][] = [];
  const deps: GateDeps = {
    cwd: '/repo',
    exists: (p) => p.endsWith('.mp4') || p.endsWith('lesson-plan.md') || p.endsWith('LESSON-DEFINITION-OF-DONE.md'),
    ensureDir: vi.fn(),
    runPython: async (argv) => {
      pyCalls.push(argv);
      return argv[0].includes('gemini') ? 'TRANSCRIPT REPORT' : 'frame: /repo/.../0001.png';
    },
    judge: vi.fn(async () => 'Verdict: FIX\n- t=00:51 leaked authoring instruction on slide'),
    readText: (p) =>
      p.endsWith('lesson-plan.md') ? '# plan' :
      p.endsWith('LESSON-DEFINITION-OF-DONE.md') ? '## Gate C — Watch gate\n- [ ] Renders & plays\n---\n## Done =' :
      '',
    writeText: (p, s) => { writes[p] = s; },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...over,
  };
  return { deps, writes, pyCalls };
}

describe('runGate', () => {
  it('auto mode: collects sensors, has Claude judge, writes watch-gate.md, returns the verdict', async () => {
    const { deps, writes, pyCalls } = makeDeps();
    const res = await runGate('topic-1-lesson-1', { mode: 'auto', provider: 'gemini-voice', transcript: true, resolution: 1024 }, deps);

    expect(pyCalls.some((c) => c[0].includes('watch.py'))).toBe(true); // frames collected
    expect(pyCalls.some((c) => c[0].includes('gemini-watch.py'))).toBe(true); // transcript collected
    expect(deps.judge).toHaveBeenCalledOnce();
    const verdictPath = gatePaths('topic-1-lesson-1', '/repo').verdict;
    expect(writes[verdictPath]).toContain('leaked authoring instruction');
    expect(res.verdict).toBe('FIX');
  });

  it('frames-only when transcript is off: no gemini call, transcript stays out of the prompt', async () => {
    const { deps, pyCalls } = makeDeps();
    const judgeSpy = deps.judge as ReturnType<typeof vi.fn>;
    await runGate('topic-1-lesson-1', { mode: 'auto', provider: 'gemini-voice', transcript: false, resolution: 1024 }, deps);
    expect(pyCalls.some((c) => c[0].includes('gemini-watch.py'))).toBe(false);
    expect(judgeSpy.mock.calls[0][0]).toMatch(/frames-only|no audio|not assessed/i);
  });

  it('collect mode: writes the judge prompt for a human/interactive judge, does NOT call Claude or write a verdict', async () => {
    const { deps, writes } = makeDeps();
    const res = await runGate('topic-1-lesson-1', { mode: 'collect', provider: 'gemini-voice', transcript: true, resolution: 1024 }, deps);
    expect(deps.judge).not.toHaveBeenCalled();
    const p = gatePaths('topic-1-lesson-1', '/repo');
    expect(writes[p.judgePrompt]).toBeTruthy();
    expect(writes[p.verdict]).toBeUndefined(); // verdict is the human's call here
    expect(res.verdict).toBe('pending');
  });

  it('refuses when the rendered mp4 is missing', async () => {
    const { deps } = makeDeps({ exists: () => false });
    await expect(
      runGate('topic-1-lesson-1', { mode: 'auto', provider: 'gemini-voice', transcript: true, resolution: 1024 }, deps),
    ).rejects.toThrow(/mp4|render/i);
  });
});
