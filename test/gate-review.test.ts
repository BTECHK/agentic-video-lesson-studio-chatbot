import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { extractGateSection, buildReviewPrompt, runReview, type ReviewDeps } from '../src/lib/gate-review';

const DOD = [
  '## Gate A — Fidelity · Provenance · Freshness', 'a-checklist', 'every claim cited', '',
  '## Gate B — Teaching axis', 'b-checklist', '- [ ] Leads with the transformation', '',
  '## Gate C — Watch gate', 'c-checklist', '',
  '---', '## Done =', 'final',
].join('\n');

describe('extractGateSection', () => {
  it('slices exactly the requested gate, stopping at the next gate or the ---', () => {
    expect(extractGateSection(DOD, 'A')).toContain('every claim cited');
    expect(extractGateSection(DOD, 'A')).not.toContain('Teaching axis');
    const b = extractGateSection(DOD, 'B');
    expect(b).toContain('Leads with the transformation');
    expect(b).not.toContain('Gate A');
    expect(b).not.toContain('Gate C');
  });
});

describe('buildReviewPrompt', () => {
  const base = { lessonId: 'topic-1-lesson-1', gateChecklist: '- [ ] check', lessonPlanMd: '# plan', lessonContextMd: 'script text' };

  it('Gate B judges teaching against the lesson-plan and asks for the verdict format', () => {
    const p = buildReviewPrompt({ gate: 'B', gateName: 'Teaching axis', ...base });
    expect(p).toMatch(/judge/i);
    expect(p).toMatch(/teach/i);
    expect(p).toContain('# plan');
    expect(p).toMatch(/PASS|FIX/);
  });

  it('Gate A verifies claims against official docs (accuracy sweep)', () => {
    const p = buildReviewPrompt({ gate: 'A', gateName: 'Fidelity / Provenance / Freshness', ...base });
    expect(p).toMatch(/official|vendor|source|accuracy/i);
    expect(p).toMatch(/PASS|FIX/);
  });
});

function makeDeps(over: Partial<ReviewDeps> = {}): { deps: ReviewDeps; writes: Record<string, string> } {
  const writes: Record<string, string> = {};
  const deps: ReviewDeps = {
    cwd: '/repo',
    exists: () => true,
    ensureDir: vi.fn(),
    readText: (p) =>
      p.endsWith('lesson-plan.md') ? '# plan' :
      p.endsWith('LESSON-DEFINITION-OF-DONE.md') ? DOD :
      p.endsWith('script.json') ? '{"blocks":[]}' :
      p.endsWith('outline.json') ? '{"sections":[]}' : '',
    writeText: (p, s) => { writes[p] = s; },
    judge: vi.fn(async () => 'Verdict: PASS\nall checks pass'),
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...over,
  };
  return { deps, writes };
}

describe('runReview', () => {
  it('Gate B auto: judges and writes review/teaching-axis.md with the verdict', async () => {
    const { deps, writes } = makeDeps();
    const res = await runReview('topic-1-lesson-1', 'B', { mode: 'auto' }, deps);
    expect(deps.judge).toHaveBeenCalledOnce();
    const artifact = path.join('/repo', 'content', 'lessons', 'topic-1-lesson-1', 'review', 'teaching-axis.md');
    expect(writes[artifact]).toContain('all checks pass');
    expect(res.verdict).toBe('PASS');
  });

  it('Gate A auto: writes review/FACT-CHECK-REPORT.md', async () => {
    const { deps, writes } = makeDeps();
    await runReview('topic-1-lesson-1', 'A', { mode: 'auto' }, deps);
    const artifact = path.join('/repo', 'content', 'lessons', 'topic-1-lesson-1', 'review', 'FACT-CHECK-REPORT.md');
    expect(writes[artifact]).toBeTruthy();
  });

  it('collect mode: writes the judge prompt, does NOT call the judge, verdict pending', async () => {
    const { deps } = makeDeps();
    const res = await runReview('topic-1-lesson-1', 'B', { mode: 'collect' }, deps);
    expect(deps.judge).not.toHaveBeenCalled();
    expect(res.verdict).toBe('pending');
  });
});
