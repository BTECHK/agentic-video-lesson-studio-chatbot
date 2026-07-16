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
