/**
 * Gate M (media integrity) — pure logic. Catches two defects that shipped in the
 * first v2 pass because nothing checked the actual encoded MP4:
 *   1. silent video (the sizzle shipped with a near-silent placeholder, no VO)
 *   2. wrong color tag (bt470bg/BT.601 → players desaturate; HD sRGB must be bt709)
 *
 * The script layer probes the MP4 (ffprobe audio stream + color_space, ffmpeg
 * volumedetect max_volume) and hands the facts here. Kept pure so the thresholds
 * are unit-tested without needing a rendered file.
 */

export interface MediaFacts {
  hasAudioStream: boolean;
  /** Peak loudness in dBFS from ffmpeg volumedetect; null if no audio. */
  maxDb: number | null;
  /** ffprobe stream color_space, e.g. 'bt709', 'bt470bg', 'unknown'. */
  colorSpace: string;
}

export interface MediaVerdict {
  verdict: 'PASS' | 'FAIL';
  audioOk: boolean;
  colorOk: boolean;
  reasons: string[];
}

/** A render with audio quieter than this peak is treated as effectively silent. */
export const AUDIBLE_MAX_DB = -30;
export const REQUIRED_COLOR_SPACE = 'bt709';

export function evaluateMedia(facts: MediaFacts): MediaVerdict {
  const reasons: string[] = [];

  const audioOk =
    facts.hasAudioStream && facts.maxDb !== null && facts.maxDb >= AUDIBLE_MAX_DB;
  if (!facts.hasAudioStream) {
    reasons.push('no audio stream');
  } else if (facts.maxDb === null) {
    reasons.push('audio stream present but loudness unreadable');
  } else if (facts.maxDb < AUDIBLE_MAX_DB) {
    reasons.push(`effectively silent (peak ${facts.maxDb.toFixed(1)} dB < ${AUDIBLE_MAX_DB} dB)`);
  }

  const colorOk = facts.colorSpace === REQUIRED_COLOR_SPACE;
  if (!colorOk) {
    reasons.push(`color_space is "${facts.colorSpace}", expected "${REQUIRED_COLOR_SPACE}" (HD sRGB)`);
  }

  return {
    verdict: audioOk && colorOk ? 'PASS' : 'FAIL',
    audioOk,
    colorOk,
    reasons,
  };
}
