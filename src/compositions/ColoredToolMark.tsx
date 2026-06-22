import React from 'react';
import { GEMINI_GRADIENT } from './sizzle.storyboard';

/**
 * ColoredToolMark — sizzle-local, BRAND-COLORED tool glyphs.
 *
 * The lesson `ToolMark` draws monochrome marks in `currentColor`. The sizzle
 * wants each vendor in its own brand color (the original hand-crafted reel did),
 * so this is a sizzle-only sibling that reuses ToolMark's recognizable glyph
 * SHAPES (exact vendor pixel-logos are not required — the shapes read as distinct
 * at a glance) but fills each one with the vendor's color: Claude `#D97757`,
 * ChatGPT `#0f0f0f`, Perplexity `#20B8CD`, and Gemini an inline blue→purple→pink
 * `<linearGradient>`.
 *
 * The four `d` path strings below are PAIRWISE DIFFERENT (one distinct geometry
 * per tool) — that is what the AC1 distinct-glyph test asserts, and what lets the
 * icon-check script tell the chips apart by shape, not just color. `ToolMark.tsx`
 * (shared by all lessons) is untouched.
 */

/**
 * DETERMINISTIC chip layout (shared with `_sizzle-icon-check.ts`). The tool chips
 * in the `different` beat are laid out at fixed pixel positions so a checker can
 * crop each icon's glyph bbox by GEOMETRY (not by color): chip k's icon left-edge
 * sits at `CHIP_ROW_LEFT + k*(CHIP_W + CHIP_GAP) + CHIP_PAD_LEFT`, and the glyph
 * spans `ICON_SIZE` px. Icon is at the chip's LEFT (icon then text label). These
 * are STAGE coordinates (the 1920×1080 inner stage), pre-9:16 scaling.
 */
export const ICON_SIZE = 34;
export const CHIP_W = 230; // fixed chip width so positions are computable
export const CHIP_GAP = 18;
export const CHIP_PAD_LEFT = 24; // chip's left padding before the icon
export const CHIP_ROW_LEFT = 130; // = MARGIN in SizzleManifesto
// Chip row is absolutely pinned so the icon's Y is computable too. Icon top =
// CHIP_ROW_TOP + chip vertical padding (14px) — the chip is `align-items:center`
// over ICON_SIZE, so the icon sits flush at the top of the content box.
export const CHIP_ROW_TOP = 720;
export const CHIP_PAD_TOP = 14;
export const FLOAT_AMP = 14; // chips bob ±FLOAT_AMP; widen the crop band by this

/** Icon glyph bbox (STAGE px) for chip index `k`, left→right (nominal, pre-float). */
export function iconBbox(k: number): { left: number; top: number; size: number } {
  return {
    left: CHIP_ROW_LEFT + k * (CHIP_W + CHIP_GAP) + CHIP_PAD_LEFT,
    top: CHIP_ROW_TOP + CHIP_PAD_TOP,
    size: ICON_SIZE,
  };
}

/** Distinct glyph geometry per tool — one `d` per vendor, all different. */
export const TOOL_GLYPH_D: Record<string, string> = {
  // Claude — radiating sunburst (stroked).
  claude: 'M50 10 V90 M10 50 H90 M21.7 21.7 L78.3 78.3 M78.3 21.7 L21.7 78.3',
  // ChatGPT — hexagonal ring (stroked).
  chatgpt: 'M50 8 L86 29 V71 L50 92 L14 71 V29 Z',
  // Gemini — four-point sparkle (filled, with the gradient).
  gemini: 'M50 6 C54 30 70 46 94 50 C70 54 54 70 50 94 C46 70 30 54 6 50 C30 46 46 30 50 6 Z',
  // Perplexity — ringed vertical stem (stroked).
  perplexity: 'M50 9 V91 M83 50 A33 33 0 1 1 17 50 A33 33 0 1 1 83 50',
};

function toolKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

let gradSeq = 0;

export const ColoredToolMark: React.FC<{ name: string; color?: string; size?: number }> = ({
  name,
  color,
  size = 34,
}) => {
  const key = toolKey(name);
  const d = TOOL_GLYPH_D[key];
  const filled = key === 'gemini'; // sparkle is a fill; the rest are strokes
  // Unique gradient id per instance so multiple Gemini marks never collide.
  const gradId = React.useMemo(() => `gemini-grad-${gradSeq++}`, []);
  const isGemini = color === GEMINI_GRADIENT || key === 'gemini';
  const paint = isGemini ? `url(#${gradId})` : color ?? '#1C1C1C';

  if (!d) {
    // Unknown tool — clean two-letter monogram fallback.
    const mono = (name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').replace(/^./, (c) => c.toUpperCase());
    return (
      <span style={{ fontWeight: 800, fontSize: Math.round(size * 0.7), color: isGemini ? '#7C6CF5' : color }}>
        {mono}
      </span>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {isGemini && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="22%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="78%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      )}
      <path
        d={d}
        {...(filled
          ? { fill: paint }
          : { stroke: paint, strokeWidth: 14, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' })}
      />
    </svg>
  );
};
