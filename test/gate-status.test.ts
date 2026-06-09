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
});

describe('summarizeGates', () => {
  it('is allGreen only when A, B, C and L all PASS', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
    });
    expect(s.allGreen).toBe(true);
    expect(s.gates.map((g) => g.gate)).toEqual(['A', 'B', 'C', 'L']);
  });
  it('is not green when any gate is missing or failing', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: null, B: 'Verdict: PASS', C: 'Verdict: FIX', L: 'Verdict: PASS',
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'A')!.state).toBe('missing');
    expect(s.gates.find((g) => g.gate === 'C')!.state).toBe('fix');
  });
  it('is not green when the layout gate has not run', () => {
    const s = summarizeGates('topic-1-lesson-1', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: null,
    });
    expect(s.allGreen).toBe(false);
    expect(s.gates.find((g) => g.gate === 'L')!.state).toBe('missing');
  });
});

describe('canPublish', () => {
  it('allows publish when all four gates are green', () => {
    const s = summarizeGates('x', {
      A: 'Verdict: PASS', B: 'Verdict: PASS', C: 'Verdict: PASS', L: 'Verdict: PASS',
    });
    expect(canPublish(s).ok).toBe(true);
  });
  it('blocks publish and names the gates that are not passing', () => {
    const s = summarizeGates('x', {
      A: null, B: 'Verdict: PASS', C: 'Verdict: FIX', L: null,
    });
    const d = canPublish(s);
    expect(d.ok).toBe(false);
    expect(d.reasons.join(' ')).toMatch(/Gate A/);
    expect(d.reasons.join(' ')).toMatch(/Gate C/);
    expect(d.reasons.join(' ')).toMatch(/Gate L/);
    expect(d.reasons.join(' ')).not.toMatch(/Gate B/); // B passed
  });
});
