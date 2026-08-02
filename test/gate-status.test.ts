import { describe, it, expect } from 'vitest';
import { parseGateState, summarizeGates, canPublish } from '../src/lib/gate-status';

describe('parseGateState', () => {
  it('reads the Verdict line: PASS → pass, FIX/FAIL → fix', () => {
    expect(parseGateState('Verdict: PASS\n...')).toBe('pass');
    expect(parseGateState('Verdict: FIX\n...')).toBe('fix');
    expect(parseGateState('...\nverdict - fail')).toBe('fix');
  });
  it('treats a missing file as missing and a verdict-less file as not-green', () => {
    expect(parseGateState(null)).toBe('missing');
    expect(parseGateState('a report with no machine verdict line')).toBe('fix');
  });
  it('fails closed on a Verdict buried under judge preamble (Codex finding 2026-07-15)', () => {
    expect(parseGateState('Write was blocked pending permission — verdict below:\n\nVerdict: PASS\nbody')).toBe('fix');
    expect(parseGateState('\n\nVerdict: PASS\nbody')).toBe('pass'); // leading blank lines OK
  });
});

describe('summarizeGates', () => {
  it('is allGreen only when A, B, C, L and T all PASS', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
      T: 'Verdict: PASS',
    });
    expect(s.allGreen).toBe(true);
    expect(s.gates.map((g) => g.gate)).toEqual(['A', 'B', 'C', 'L', 'T']);
  });
  it('is not green when any gate is missing or failing', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: null, B: 'Verdict: PASS', C: 'Verdict: FIX', L: 'Verdict: PASS', T: 'Verdict: PASS',
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'A')!.state).toBe('missing');
    expect(s.gates.find((g) => g.gate === 'C')!.state).toBe('fix');
  });
  it('is not green when the layout gate has not run', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: null, T: 'Verdict: PASS',
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'L')!.state).toBe('missing');
  });
  it('is not green when the timing gate has not run', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS', T: null,
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'T')!.state).toBe('missing');
  });
  it('is not green when the timing gate has a WARN verdict (WARN not in parseGateState regex)', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
      T: 'Verdict: WARN',
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'T')!.state).toBe('fix');
  });
});

describe('summarizeGates — staleness (mp4-judging gates C/L/T only)', () => {
  const contents = {
    A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS', T: 'Verdict: PASS',
  };

  it('marks C/L/T stale when their artifact predates the rendered MP4', () => {
    const s = summarizeGates('x', contents, { mp4: 200, A: 100, B: 100, C: 100, L: 100, T: 100 });
    expect(s.gates.find((g) => g.gate === 'C')!.state).toBe('stale');
    expect(s.gates.find((g) => g.gate === 'L')!.state).toBe('stale');
    expect(s.gates.find((g) => g.gate === 'T')!.state).toBe('stale');
    expect(s.allGreen).toBe(false);
  });

  it('does not stale-flag content gates A/B even when older than the MP4', () => {
    const s = summarizeGates('x', contents, { mp4: 200, A: 100, B: 100, C: 300, L: 300, T: 300 });
    expect(s.gates.find((g) => g.gate === 'A')!.state).toBe('pass');
    expect(s.gates.find((g) => g.gate === 'B')!.state).toBe('pass');
    expect(s.allGreen).toBe(true);
  });

  it('keeps a normal verdict when the artifact postdates the MP4', () => {
    const s = summarizeGates('x', contents, { mp4: 100, A: 200, B: 200, C: 200, L: 200, T: 200 });
    expect(s.gates.find((g) => g.gate === 'C')!.state).toBe('pass');
    expect(s.gates.find((g) => g.gate === 'L')!.state).toBe('pass');
    expect(s.gates.find((g) => g.gate === 'T')!.state).toBe('pass');
    expect(s.allGreen).toBe(true);
  });

  it('leaves current behavior unchanged when the MP4 is missing (mtimes omitted)', () => {
    const s = summarizeGates('x', contents);
    expect(s.gates.every((g) => g.state === 'pass')).toBe(true);
    expect(s.allGreen).toBe(true);
  });

  it('leaves current behavior unchanged when mp4 mtime is explicitly null (MP4 absent)', () => {
    const s = summarizeGates('x', contents, { mp4: null, C: 1, L: 1, T: 1 });
    expect(s.gates.every((g) => g.state === 'pass')).toBe(true);
  });

  it('never stale-flags an already-missing gate', () => {
    const s = summarizeGates('x', { ...contents, C: null }, { mp4: 200, C: 100 });
    expect(s.gates.find((g) => g.gate === 'C')!.state).toBe('missing');
  });
});

describe('canPublish — staleness', () => {
  it('blocks publish on a stale gate (does not count as green) and names it', () => {
    const s = summarizeGates('x', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS', T: 'Verdict: PASS',
    }, { mp4: 200, C: 100, L: 300, T: 300 });
    const d = canPublish(s);
    expect(d.ok).toBe(false);
    expect(d.reasons.join(' ')).toMatch(/Gate C/);
    expect(d.reasons.join(' ')).toMatch(/stale/i);
  });
});

describe('canPublish', () => {
  it('allows publish when all five gates are green', () => {
    const s = summarizeGates('x', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
      T: 'Verdict: PASS',
    });
    expect(canPublish(s).ok).toBe(true);
  });
  it('blocks publish and names the gates that are not passing', () => {
    const s = summarizeGates('x', {
      A: null, B: 'Verdict: PASS', C: 'Verdict: FIX', L: null, T: 'Verdict: PASS',
    });
    const d = canPublish(s);
    expect(d.ok).toBe(false);
    expect(d.reasons.join(' ')).toMatch(/Gate A/);
    expect(d.reasons.join(' ')).toMatch(/Gate C/);
    expect(d.reasons.join(' ')).toMatch(/Gate L/);
    expect(d.reasons.join(' ')).not.toMatch(/Gate B/); // B passed
    expect(d.reasons.join(' ')).not.toMatch(/Gate T/); // T passed
  });
  it('blocks publish when timing gate is WARN (WARN counts as not-green)', () => {
    const s = summarizeGates('x', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
      T: 'Verdict: WARN',
    });
    const d = canPublish(s);
    expect(d.ok).toBe(false);
    expect(d.reasons.join(' ')).toMatch(/Gate T/);
  });
});
