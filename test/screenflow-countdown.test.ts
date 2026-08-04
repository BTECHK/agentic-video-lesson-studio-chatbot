import { describe, it, expect } from 'vitest';
import { countdownSecondsRemaining, formatCountdown } from '../src/compositions/lesson-scenes/ScreenFlow';

/**
 * Countdown atom math (watch-gate fix: "Implement a real countdown atom
 * instead of the text description"). Pure, frame-driven —
 * no wall clock, no timers — so it's fully testable without a Remotion
 * player context.
 */
describe('countdownSecondsRemaining', () => {
  it('starts at the full countdownSeconds value on the step\'s first active frame', () => {
    expect(countdownSecondsRemaining(100, 100, 50, 60, true, false)).toBe(60);
  });

  it('ticks down mid-window (60s phase)', () => {
    // halfway through a 50-frame active window -> ~half of 60s remaining
    expect(countdownSecondsRemaining(125, 100, 50, 60, true, false)).toBe(30);
  });

  it('ticks down mid-window (30s phase — same atom, different countdownSeconds)', () => {
    expect(countdownSecondsRemaining(125, 100, 50, 30, true, false)).toBe(15);
  });

  it('reaches exactly 0 on the last active frame', () => {
    expect(countdownSecondsRemaining(150, 100, 50, 60, true, false)).toBe(0);
  });

  it('never goes negative if frame overruns the active window', () => {
    expect(countdownSecondsRemaining(500, 100, 50, 60, true, false)).toBe(0);
  });

  it('phase transition: freezes at 0 once the step is past (never resumes, never negative)', () => {
    expect(countdownSecondsRemaining(9999, 100, 50, 60, false, true)).toBe(0);
  });

  it('hideUntilActive-style gate: returns null before the step is active (no leaked value)', () => {
    expect(countdownSecondsRemaining(0, 100, 50, 60, false, false)).toBeNull();
  });

  it('is deterministic — same inputs always produce the same output', () => {
    const a = countdownSecondsRemaining(130, 100, 50, 60, true, false);
    const b = countdownSecondsRemaining(130, 100, 50, 60, true, false);
    expect(a).toBe(b);
  });
});

describe('formatCountdown', () => {
  it('formats a full 60s phase as mm:ss', () => {
    expect(formatCountdown(60)).toBe('01:00');
  });

  it('formats a full 30s phase as mm:ss', () => {
    expect(formatCountdown(30)).toBe('00:30');
  });

  it('formats 0 as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('pads single-digit seconds', () => {
    expect(formatCountdown(5)).toBe('00:05');
  });
});
