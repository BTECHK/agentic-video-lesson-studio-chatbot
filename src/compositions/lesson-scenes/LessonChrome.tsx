import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BRAND, CHROME_INK } from '../../brand/tokens';
import { fontFamily } from './shared';
import { CAPTION_BOTTOM } from './LessonCaptions';

/**
 * Persistent lesson chrome — wordmark, scene label, progress dots, scene
 * counter. The "stakeholder-ready" framing the v2 facelift adds (LessonVideo had
 * none). Charcoal-on-linen, held in the four corners INSIDE the safe area
 * (x:96/y:54) so gate:layout's whole-document text scan never flags it.
 */

export type ChromeScene = { start: number; duration: number; label?: string };

const INSET = 96;

/**
 * Bottom inset of the chrome footer row (progress dots + scene counter). Pinned
 * a fixed clearance above the caption chip (CAPTION_BOTTOM, ~60px tall) so the
 * two bottom overlays keep >=30px separation and can't collide on a wide caption.
 */
const CHROME_BOTTOM = CAPTION_BOTTOM + 90;

export const LessonChrome: React.FC<{ scenes: ChromeScene[]; fallbackLabel?: string }> = ({
  scenes,
  fallbackLabel,
}) => {
  const frame = useCurrentFrame();
  if (scenes.length === 0) return null;

  let active = scenes.findIndex((s) => frame >= s.start && frame < s.start + s.duration);
  if (active < 0) active = frame < scenes[0].start ? 0 : scenes.length - 1;
  const label = (scenes[active]?.label || fallbackLabel || '').toUpperCase();

  return (
    <AbsoluteFill style={{ fontFamily, pointerEvents: 'none' }}>
      {/* top-left wordmark */}
      <div
        style={{
          position: 'absolute',
          left: INSET,
          top: 64,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          fontSize: 26,
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: BRAND.colors.accent, fontWeight: BRAND.font.weights.extraBold }}>Sample</span>
        <span style={{ color: BRAND.colors.textMuted, fontWeight: BRAND.font.weights.regular, fontSize: 22 }}>
          Academy
        </span>
      </div>

      {/* top-right scene label */}
      {label && (
        <div
          style={{
            position: 'absolute',
            right: INSET,
            top: 70,
            fontSize: 16,
            fontWeight: BRAND.font.weights.semiBold,
            letterSpacing: '0.12em',
            color: BRAND.colors.textMuted,
          }}
        >
          {label}
        </div>
      )}

      {/* bottom-left progress dots */}
      <div style={{ position: 'absolute', left: INSET, bottom: CHROME_BOTTOM, display: 'flex', gap: 7, alignItems: 'center' }}>
        {scenes.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === active ? 26 : 7,
              height: 7,
              borderRadius: 4,
              background:
                i === active
                  ? BRAND.colors.accent
                  : i < active
                    ? 'rgba(139,38,53,0.5)'
                    : CHROME_INK.dotInactive,
            }}
          />
        ))}
      </div>

      {/* bottom-right scene counter */}
      <div
        style={{
          position: 'absolute',
          right: INSET,
          bottom: CHROME_BOTTOM,
          fontFamily: BRAND.font.mono,
          fontSize: 16,
          letterSpacing: '0.08em',
          color: CHROME_INK.counter,
        }}
      >
        {String(active + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
      </div>
    </AbsoluteFill>
  );
};
