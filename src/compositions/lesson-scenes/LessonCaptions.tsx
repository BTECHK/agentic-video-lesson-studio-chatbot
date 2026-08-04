import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { NarrationWord } from '../../../content/schemas/lesson';
import { narrationToPages } from '../../lib/captions';
import { fontFamily, BRAND } from './shared';
import { CAPTION } from '../../brand/tokens';

/**
 * Bottom inset of the caption chip. Shared with LessonChrome so the chrome
 * footer row (dots/counter) can be pinned a fixed clearance above it and the
 * two bottom overlays can never drift into each other.
 */
export const CAPTION_BOTTOM = 72;

/**
 * Word-synced caption band for a lesson scene. Words are scene-relative (ms
 * from the scene's audio start), matching how each scene's <Audio> plays from
 * its own sequence start. Renders one TikTok-style page at a time with the
 * spoken word highlighted in the brand accent — restrained, on the warm linen
 * base, not a karaoke overlay.
 *
 * Legibility: inactive words previously used MUTED (0.62 charcoal) on a
 * 0.55-alpha chip — ~4.5:1 and washed out to the point of reading as broken
 * text (hail-mary audit). Full-charcoal CAPTION.ink on the stronger
 * CAPTION.chipAlpha backing is now AAA-class (>=7:1); the active-word accent
 * still clears 4.5:1 over the same chip.
 */
export const LessonCaptions: React.FC<{ words: NarrationWord[]; combineMs?: number }> = ({
  words,
  combineMs = 1400,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const pages = React.useMemo(() => narrationToPages(words, combineMs), [words, combineMs]);
  if (pages.length === 0) return null;

  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs);
  if (!page) return null;

  // Gentle fade as each page enters.
  const intoPage = nowMs - page.startMs;
  const opacity = interpolate(intoPage, [0, CAPTION.fadeMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: CAPTION_BOTTOM,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          padding: '8px 26px',
          // Borderless, soft frosted backing — reads as a clean subtitle, not a
          // boxed UI chip. Blur keeps it legible over content without a hard edge.
          backgroundColor: `rgba(237,232,227,${CAPTION.chipAlpha})`, // = BRAND.colors.bgBase
          borderRadius: BRAND.radius,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          fontFamily,
          fontSize: 34,
          fontWeight: BRAND.font.weights.bold,
          lineHeight: 1.3,
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {page.tokens.map((tok, i) => {
          const active = nowMs >= tok.fromMs && nowMs < tok.toMs;
          return (
            <span
              key={`${tok.fromMs}-${i}`}
              style={{
                color: active ? BRAND.colors.accent : CAPTION.ink,
                transition: 'color 80ms linear',
              }}
            >
              {i === 0 ? tok.text : ` ${tok.text}`}
            </span>
          );
        })}
      </div>
    </div>
  );
};
