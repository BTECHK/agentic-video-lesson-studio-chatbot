import { describe, it, expect } from 'vitest';
import { easeInOutCubic, typedCount, cursorAt } from '../src/compositions/lesson-scenes/primitives';

// v2 motion primitives — pure timing/geometry helpers. The components are
// frame-driven wrappers around these, so testing the math here is the check
// that the animations land where the scene beats expect.

describe('easeInOutCubic', () => {
  it('pins the endpoints and midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });
  it('clamps out-of-range input', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
  it('is monotonic', () => {
    let prev = -1;
    for (let x = 0; x <= 1.0001; x += 0.05) {
      const v = easeInOutCubic(x);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('typedCount', () => {
  it('is 0 at/before start and full at/after end', () => {
    expect(typedCount(0, 10, 30, 20)).toBe(0);
    expect(typedCount(10, 10, 30, 20)).toBe(0);
    expect(typedCount(40, 10, 30, 20)).toBe(20);
    expect(typedCount(100, 10, 30, 20)).toBe(20);
  });
  it('reveals proportionally mid-flight', () => {
    expect(typedCount(25, 10, 30, 20)).toBe(10); // halfway → 10 of 20
  });
  it('treats non-positive duration as instant', () => {
    expect(typedCount(11, 10, 0, 20)).toBe(20);
  });
});

describe('cursorAt', () => {
  const keys = [
    { frame: 0, x: 0, y: 0 },
    { frame: 10, x: 100, y: 0 },
  ];
  it('is hidden before the first keyframe, parked at its position', () => {
    expect(cursorAt(keys, -5)).toEqual({ x: 0, y: 0, visible: false });
  });
  it('holds the last keyframe after the end', () => {
    expect(cursorAt(keys, 50)).toEqual({ x: 100, y: 0, visible: true });
  });
  it('eases between keyframes (midpoint of easeInOutCubic = 0.5)', () => {
    const mid = cursorAt(keys, 5);
    expect(mid.visible).toBe(true);
    expect(mid.x).toBeCloseTo(50, 4);
  });
  it('handles an empty keyframe list', () => {
    expect(cursorAt([], 3)).toEqual({ x: 0, y: 0, visible: false });
  });
});
