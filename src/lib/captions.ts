import { createTikTokStyleCaptions, type Caption, type TikTokPage } from '@remotion/captions';
import type { NarrationWord } from '../../content/schemas/lesson';

/**
 * Captions (Phase E, design §4) — convert aligner word timestamps into the
 * verified `@remotion/captions` types so scenes can render word-synced text.
 *
 * Word timestamps are scene-relative (ms from the start of the scene's audio),
 * matching how each scene's `<Audio>` plays from its own sequence start.
 */

/** Default window (ms) for grouping words onto one on-screen caption page. */
export const DEFAULT_COMBINE_MS = 1200;

/**
 * One Caption per word; `timestampMs` is the word's midpoint (TikTok
 * convention). Each word carries a leading space so `createTikTokStyleCaptions`
 * renders words separated and treats every word as a valid page-break point
 * (its splitter only breaks on tokens whose text starts with a space).
 */
export function wordsToCaptions(words: NarrationWord[]): Caption[] {
  return words.map((w) => ({
    text: ` ${w.word}`,
    startMs: w.startMs,
    endMs: w.endMs,
    timestampMs: (w.startMs + w.endMs) / 2,
    confidence: null,
  }));
}

/** Word timestamps → TikTok-style caption pages for on-screen rendering. */
export function narrationToPages(
  words: NarrationWord[],
  combineMs: number = DEFAULT_COMBINE_MS,
): TikTokPage[] {
  if (words.length === 0) return [];
  const { pages } = createTikTokStyleCaptions({
    captions: wordsToCaptions(words),
    combineTokensWithinMilliseconds: combineMs,
  });
  return pages;
}
