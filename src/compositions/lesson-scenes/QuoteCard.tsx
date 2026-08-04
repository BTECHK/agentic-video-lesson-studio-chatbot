import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import type { SceneComponentProps } from '../../lib/scene-types';
import type { NarrationWord } from '../../../content/schemas/lesson';
import type { QuoteCardContent } from './content-types';
import { BRAND, LEADING, MOTION, space } from '../../brand/tokens';
import { SceneFrame, Eyebrow, useGlideIn, useMotionProfile, renderAccented } from './shared';

/**
 * `quote-card` — one Instructor-voice quote that anchors a lesson.
 *
 * Gate C 2026-06-08 defects fixed here (#72): the previous oversized decorative
 * mark was a lone unmatched `“` forced into a fixed-height box (fontSize 200 in
 * height 90), which spilled and collided with neighbors. Quote marks are now
 * matched, inline, accent-colored, and size intrinsically with the quote text —
 * nothing to overflow, nothing unclosed.
 */

export const QUOTE_MARKS = { open: '“', close: '”' } as const;

export const quoteStyles = {
  quote: {
    margin: 0,
    fontWeight: BRAND.font.weights.semiBold,
    fontSize: 56,
    lineHeight: LEADING.quote,
    letterSpacing: '-0.01em',
    maxWidth: 1180,
  } satisfies React.CSSProperties,
  attribution: {
    display: 'flex',
    alignItems: 'center',
    gap: space(4),
    marginTop: space(4),
    fontWeight: BRAND.font.weights.bold,
    fontSize: 26,
    color: BRAND.colors.textMuted,
  } satisfies React.CSSProperties,
} as const;

/**
 * v4 word-synced reveal count (pure, unit-testable). Overall narration progress
 * is `elapsedMs / lastWordEndMs` clamped to 0..1; the quote reveals
 * `ceil(progress * quoteWordCount)` of its words. Monotonic in `elapsedMs`,
 * 0 at the start, all words once progress hits 1. Kept separate from the JSX so
 * the reveal timing is falsifiable without rendering (test/v4-scenes.test.ts).
 */
export function quoteRevealCount(
  elapsedMs: number,
  lastWordEndMs: number,
  quoteWordCount: number,
): number {
  if (quoteWordCount <= 0 || lastWordEndMs <= 0) return quoteWordCount;
  const progress = Math.min(1, Math.max(0, elapsedMs / lastWordEndMs));
  return Math.ceil(progress * quoteWordCount);
}

/** A per-word glide over ~8 frames — opacity + a small upward settle. Reveals
 *  land hard (cubic-out) so a word is fully inked shortly after its cue. */
const WORD_GLIDE_FRAMES = 8;

/**
 * v4 progressive-reveal render of a quote. Splits on whitespace (accent `*word*`
 * markers stay attached to their word), reveals `quoteRevealCount` words in sync
 * with narration, and renders EVERY word in place — upcoming words sit at 12%
 * opacity so the block reserves its final layout and never reflows as words land.
 */
function renderQuoteWords(
  quote: string,
  words: NarrationWord[],
  frame: number,
  fps: number,
): React.ReactNode {
  const tokens = quote.split(/\s+/).filter((t) => t.length > 0);
  const elapsedMs = (frame / fps) * 1000;
  const lastWordEndMs = words[words.length - 1]?.endMs ?? 0;
  const revealed = quoteRevealCount(elapsedMs, lastWordEndMs, tokens.length);
  // The narration cue for the last-revealed word drives its glide-in start, so a
  // word settles from the moment it becomes visible rather than snapping.
  return tokens.map((tok, i) => {
    const isRevealed = i < revealed;
    const cueFrame = ((words[i]?.startMs ?? 0) / 1000) * fps;
    const p = interpolate(frame, [cueFrame, cueFrame + WORD_GLIDE_FRAMES], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const opacity = isRevealed ? interpolate(p, [0, 1], [0.12, 1]) : 0.12;
    const translateY = isRevealed ? interpolate(p, [0, 1], [MOTION.glide.fromY / 3, 0]) : 0;
    return (
      <React.Fragment key={i}>
        {i > 0 ? ' ' : ''}
        <span
          style={{
            display: 'inline-block',
            opacity,
            transform: `translateY(${translateY}px)`,
            color: isAccented(tok) ? BRAND.colors.accent : undefined,
          }}
        >
          {stripAccent(tok)}
        </span>
      </React.Fragment>
    );
  });
}

// Accent markers (`*word*`) may bound a single token or open/close a multi-word
// span across tokens; a token is accented if it touches an asterisk, and the
// asterisks are stripped so none ever render as stray text.
const isAccented = (tok: string): boolean => tok.startsWith('*') || tok.endsWith('*');
const stripAccent = (tok: string): string => tok.replace(/^\*|\*$/g, '');

export const QuoteCard: React.FC<SceneComponentProps> = ({ scene, narrationWords }) => {
  const c = scene.content as unknown as QuoteCardContent;
  const frame = useCurrentFrame();
  const profile = useMotionProfile();
  const quote = useGlideIn(18, 24);
  const attr = useGlideIn(34, 16);
  const { fps } = useVideoConfig();
  // Idle float — the blockquote breathes on its own slow phase so the moment
  // never settle-and-freezes through the long hold (motion-contract idle float).
  const floatY = Math.sin((frame - 42) * 0.035) * 7;

  // v4 (only when word timings are present): reveal the quote word-by-word in
  // sync with narration, killing the long static hold. v3 or no words → exactly
  // today's behavior (renderAccented in one entrance).
  const wordSynced = profile === 'v4' && narrationWords !== undefined && narrationWords.length > 0;

  return (
    <SceneFrame align="flex-start" paddingX={180}>
      {/* Oversized ghost open-quote behind the text — an accentSoft anchor that
          occupies the void the inline marks can't fill. Zero collision: it sits
          behind the blockquote and is decor-only.
          top:140 (was 200) — the glyph's descender "leg" was crowding the
          Eyebrow row rendered just below it (defect: scenes 03+05). Shifted
          up for breathing room; purely decorative, doesn't move any text. */}
      <div
        aria-hidden
        data-decor
        style={{
          position: 'absolute',
          left: 120,
          top: 140,
          fontSize: 360,
          lineHeight: 1,
          fontWeight: BRAND.font.weights.bold,
          color: BRAND.colors.accentSoft,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {QUOTE_MARKS.open}
      </div>

      <Eyebrow delay={6}>{c.eyebrow}</Eyebrow>

      <blockquote
        style={{
          ...quote,
          ...quoteStyles.quote,
          position: 'relative',
          transform: `${quote.transform} translateY(${floatY}px)`,
        }}
      >
        <span style={{ color: BRAND.colors.accent }}>{QUOTE_MARKS.open}</span>
        {wordSynced
          ? renderQuoteWords(c.quote, narrationWords, frame, fps)
          : renderAccented(c.quote)}
        <span style={{ color: BRAND.colors.accent }}>{QUOTE_MARKS.close}</span>
      </blockquote>

      <div style={{ ...attr, ...quoteStyles.attribution }}>
        <span
          style={{ width: space(10), height: space(1), backgroundColor: BRAND.colors.accent, borderRadius: BRAND.radius }}
        />
        {c.attribution}
      </div>
    </SceneFrame>
  );
};
