/**
 * Gate Mo (motion/liveliness) — pure logic. Catches the defect that the v2 sizzle
 * shipped with: a video that fades each beat in over ~1s then HOLDS frozen for the
 * rest of the beat — a recorded slideshow, not an animated promo. Nothing measured
 * motion, so a static render passed every other gate.
 *
 * The script layer samples low-res grayscale frames from the encoded MP4 at a
 * fixed cadence and hands the adjacent-frame luma differences here. Kept pure so
 * the thresholds are unit-tested without a rendered file.
 *
 * Two ways to fail:
 *   1. too static overall   — fewer than MIN_ACTIVE_PCT of frames show any change
 *   2. a slideshow hold      — any frozen stretch longer than MAX_FROZEN_RUN_SEC
 *
 * Note on the metric: `meanMotion` is intentionally NOT a gate criterion. A
 * fast-cut slideshow scores a high mean (big spikes at each hard cut) while
 * sitting frozen between them — so the mean rewards exactly the defect we're
 * catching. `activePct` (how OFTEN the frame changes) is the honest signal, and
 * it separates static from alive identically for a 65s promo and a 40s narrated
 * lesson, so one threshold serves both.
 */

export interface MotionFacts {
  /** Adjacent-sample mean absolute luma difference, normalized 0..1, in order. */
  diffs: number[];
  /** Samples per second the diffs were taken at (e.g. 2 = one frame every 0.5s). */
  sampleFps: number;
}

export interface MotionVerdict {
  verdict: 'PASS' | 'FAIL';
  /** Average adjacent-frame change across the whole clip. */
  meanMotion: number;
  /** Fraction of sample-pairs that showed visible change (≥ FROZEN_THRESHOLD). */
  activePct: number;
  /** Longest continuous stretch (seconds) with no visible change. */
  longestFrozenRunSec: number;
  reasons: string[];
}

/**
 * Per-pair luma diff below this counts as "no visible change" (a frozen frame).
 * Calibrated empirically against real renders (160×90 grayscale @ 2 fps): a truly
 * static hold reproduces identical frames → diff exactly 0.0000; a continuously
 * animated clip never drops below ~0.0003. 0.0005 sits cleanly between the two.
 */
export const FROZEN_THRESHOLD = 0.0005;
/**
 * A clip where fewer than this fraction of frames show any visible change reads as
 * a slideshow. Calibrated against real renders: static cuts (sizzle 0.12, lessons
 * ~0.38) sit well below; continuously-alive renders (0.77–0.91) sit well above.
 */
export const MIN_ACTIVE_PCT = 0.6;
/** A video may never hold a single still longer than this (seconds). */
export const MAX_FROZEN_RUN_SEC = 2.5;

export function evaluateMotion(facts: MotionFacts): MotionVerdict {
  const { diffs, sampleFps } = facts;
  if (diffs.length === 0 || sampleFps <= 0) {
    return {
      verdict: 'FAIL',
      meanMotion: 0,
      activePct: 0,
      longestFrozenRunSec: Infinity,
      reasons: ['no motion samples (clip too short or unreadable)'],
    };
  }

  const meanMotion = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const active = diffs.filter((d) => d >= FROZEN_THRESHOLD).length;
  const activePct = active / diffs.length;

  let run = 0;
  let maxRun = 0;
  for (const d of diffs) {
    if (d < FROZEN_THRESHOLD) {
      run += 1;
      if (run > maxRun) maxRun = run;
    } else {
      run = 0;
    }
  }
  const longestFrozenRunSec = maxRun / sampleFps;

  const reasons: string[] = [];
  if (activePct < MIN_ACTIVE_PCT) {
    reasons.push(
      `only ${(activePct * 100).toFixed(0)}% of frames change (< ${(MIN_ACTIVE_PCT * 100).toFixed(0)}%) — too static`,
    );
  }
  if (longestFrozenRunSec > MAX_FROZEN_RUN_SEC) {
    reasons.push(
      `frozen for ${longestFrozenRunSec.toFixed(1)}s > ${MAX_FROZEN_RUN_SEC}s (slideshow hold)`,
    );
  }

  return {
    verdict: reasons.length === 0 ? 'PASS' : 'FAIL',
    meanMotion,
    activePct,
    longestFrozenRunSec,
    reasons,
  };
}
