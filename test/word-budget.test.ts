import { describe, it, expect } from 'vitest';
import {
  wordBudget,
  measureScriptWords,
  checkScriptLength,
  findLessonMinutes,
  CORPUS_PACE_WPS,
} from '../src/lib/word-budget';

const script = (narrations: string[]) => ({
  schemaVersion: '1.0' as const,
  lessonId: 'x',
  blocks: narrations.map((narration, i) => ({
    id: `b${i}`,
    sectionId: 's',
    beatId: `b${i}`,
    sceneType: 'cover',
    narration,
  })),
});

describe('wordBudget', () => {
  it('derives targets from minutes at the measured corpus pace (85% authoring target)', () => {
    const b = wordBudget(8);
    // 8 min × 60 s × 2.96 w/s × 0.85 ≈ 1208 words
    expect(b.targetWords).toBe(Math.round(8 * 60 * CORPUS_PACE_WPS * 0.85));
    expect(b.targetWords).toBeGreaterThan(1150);
    expect(b.targetWords).toBeLessThan(1260);
    // floor/ceiling mirror Gate T's pass band (75–120% of outline)
    expect(b.minWords).toBe(Math.round(8 * 60 * CORPUS_PACE_WPS * 0.75));
    expect(b.maxWords).toBe(Math.round(8 * 60 * CORPUS_PACE_WPS * 1.2));
  });

  it('a 10-minute lesson needs ~1500 words at TTS pace (Instructor: never 250 words for 10 minutes)', () => {
    const b = wordBudget(10);
    expect(b.targetWords).toBeGreaterThan(1400);
    expect(b.minWords).toBeGreaterThan(1250);
  });
});

describe('measureScriptWords', () => {
  it('counts words across all narration blocks', () => {
    expect(measureScriptWords(script(['one two three', 'four five']))).toBe(5);
  });
});

describe('checkScriptLength', () => {
  it('SHORT when narration is under the Gate T floor (the 2-minute-lesson failure mode)', () => {
    const tiny = script(['word '.repeat(250).trim()]); // 250 words vs 8-min target ~1208
    const r = checkScriptLength(tiny, 8);
    expect(r.verdict).toBe('SHORT');
    expect(r.words).toBe(250);
    expect(r.minWords).toBeGreaterThan(1000);
  });

  it('PASS inside the band', () => {
    const ok = script([
      'word '.repeat(600).trim(),
      'word '.repeat(600).trim(),
    ]); // 1200 words for 8 min
    expect(checkScriptLength(ok, 8).verdict).toBe('PASS');
  });

  it('LONG above the ceiling', () => {
    const long = script(['word '.repeat(1900).trim()]);
    expect(checkScriptLength(long, 8).verdict).toBe('LONG');
  });
});

describe('findLessonMinutes', () => {
  it('walks topics[].lessons[] and returns minutes (or null)', () => {
    const map = { topics: [{ id: 't1', lessons: [{ id: 'topic-1-lesson-2', minutes: 8 }] }] };
    expect(findLessonMinutes(map, 'topic-1-lesson-2')).toBe(8);
    expect(findLessonMinutes(map, 'nope')).toBeNull();
  });
});
