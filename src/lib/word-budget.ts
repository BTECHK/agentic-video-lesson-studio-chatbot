/**
 * Word-budget discipline for lesson scripts: script word count must match the
 * outline minutes, so no beat is rushed.
 *
 * Duration is audio-authoritative (timing inversion), so script word count IS
 * video length. This module turns course-map minutes into explicit word
 * constraints used at BOTH ends of the pipeline:
 *   - generation: buildScriptPrompt embeds the budget as a hard constraint
 *   - pre-flight: generate-script --check fails a SHORT script in seconds,
 *     instead of Gate T failing it after a ~30-minute render
 *
 * Pace is the MEASURED corpus TTS pace (5,050 words / 1,705 s across the
 * shipped lessons = 2.96 w/s ≈ 178 wpm, per-lesson variance ±10%), not a
 * guessed human-speech rate. The authoring target is 85% of outline minutes
 * (deliberate buffer); floor/ceiling mirror Gate T's 75–120% pass band so a
 * script that passes pre-flight cannot fail Gate T on length.
 */

export const CORPUS_PACE_WPS = 2.96;
export const AUTHORING_TARGET = 0.85;
export const FLOOR = 0.75; // Gate T pass-band lower bound
export const CEILING = 1.2; // Gate T pass-band upper bound

export interface WordBudgetResult {
  targetWords: number;
  minWords: number;
  maxWords: number;
  paceWps: number;
}

export function wordBudget(outlineMinutes: number): WordBudgetResult {
  const fullWords = outlineMinutes * 60 * CORPUS_PACE_WPS;
  return {
    targetWords: Math.round(fullWords * AUTHORING_TARGET),
    minWords: Math.round(fullWords * FLOOR),
    maxWords: Math.round(fullWords * CEILING),
    paceWps: CORPUS_PACE_WPS,
  };
}

interface ScriptLike {
  blocks: { narration: string }[];
}

export function measureScriptWords(script: ScriptLike): number {
  return script.blocks.reduce(
    (n, b) => n + b.narration.split(/\s+/).filter(Boolean).length,
    0,
  );
}

export type LengthVerdict = 'PASS' | 'SHORT' | 'LONG';

export interface LengthCheckResult extends WordBudgetResult {
  verdict: LengthVerdict;
  words: number;
  estimatedMinutes: number;
}

export function checkScriptLength(script: ScriptLike, outlineMinutes: number): LengthCheckResult {
  const budget = wordBudget(outlineMinutes);
  const words = measureScriptWords(script);
  const verdict: LengthVerdict =
    words < budget.minWords ? 'SHORT' : words > budget.maxWords ? 'LONG' : 'PASS';
  return {
    ...budget,
    verdict,
    words,
    estimatedMinutes: words / CORPUS_PACE_WPS / 60,
  };
}

interface CourseMapLike {
  topics: { lessons: { id: string; minutes: number }[] }[];
}

/** Top-level lesson.minutes (NOT row sums — wrap lessons carry live-class rows). */
export function findLessonMinutes(courseMap: CourseMapLike, lessonId: string): number | null {
  for (const topic of courseMap.topics) {
    for (const lesson of topic.lessons) {
      if (lesson.id === lessonId) return lesson.minutes;
    }
  }
  return null;
}
