import { describe, it, expect } from 'vitest';
import { parseGateState, getLessonGates } from '@/lib/lesson-gates';

describe('parseGateState', () => {
  it('reads PASS/FIX from the Verdict line; null file is missing; no verdict is not-green', () => {
    expect(parseGateState('Verdict: PASS\n...')).toBe('pass');
    expect(parseGateState('Verdict: FIX')).toBe('fix');
    expect(parseGateState(null)).toBe('missing');
    expect(parseGateState('a report with no verdict line')).toBe('fix');
  });
});

describe('getLessonGates', () => {
  it('reports all five gates in order A, B, C, L, T', () => {
    const g = getLessonGates('topic-1-lesson-1');
    expect(g.gates.map((x) => x.gate)).toEqual(['A', 'B', 'C', 'L', 'T']);
  });
  it('a lesson with no review artifacts is all-missing and not publishable', () => {
    const g = getLessonGates('module-1');
    expect(g.gates.every((x) => x.state === 'missing')).toBe(true);
    expect(g.allGreen).toBe(false);
  });
});
