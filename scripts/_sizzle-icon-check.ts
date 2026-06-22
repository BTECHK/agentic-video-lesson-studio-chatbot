/**
 * THROWAWAY (AC1 pixel proof). Given the `different` frame PNG (1920×1080, from the
 * 16:9 MP4 OR a renderStill), crop each tool's icon glyph bbox BY GEOMETRY using the
 * shared layout constants (so the text label is excluded by position, not color),
 * take the dominant NON-LINEN pixel, and print per-icon CIE2000 ΔE to its target hex.
 * For Gemini, sample the bbox's upper third vs lower third and print the two dominant
 * HSL hues (a real blue→pink gradient differs by ≥40°).
 *
 * Verdict thresholds (AC1): ΔE ≤ 18 for Claude/ChatGPT/Perplexity; Gemini hues ≥40°
 * apart, one blue (h 200–250) and one purple/pink (h 280–340).
 *
 * Usage:  npx tsx scripts/_sizzle-icon-check.ts artifacts/verification/sizzle-v2.3-fidelity/different.png
 */
import { iconBbox, ICON_SIZE, FLOAT_AMP } from '../src/compositions/ColoredToolMark';
import { SIZZLE } from '../src/compositions/sizzle.storyboard';
import { readPng, hexToRgb, deltaE2000, rgbToHsl, dominantNonLinen, fmt, pixel } from './_sizzle-color-lib';

// Same non-linen test as dominantNonLinen: count non-linen pixels in one row of the crop.
const LINEN = { r: 0xed, g: 0xe8, b: 0xe3 };
function nonLinenCountInRow(png: ReturnType<typeof readPng>, x0: number, w: number, y: number): number {
  if (y < 0 || y >= png.height) return 0;
  let n = 0;
  for (let x = Math.round(x0); x < x0 + w; x++) {
    if (x < 0 || x >= png.width) continue;
    if (deltaE2000(pixel(png, x, y), LINEN) < 12) continue;
    n++;
  }
  return n;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: tsx scripts/_sizzle-icon-check.ts <different.png>');
  process.exit(1);
}
const png = readPng(file);
// Bbox y is widened by ±FLOAT_AMP because the chips bob; this still excludes the
// text label, which is to the RIGHT of the icon column (excluded by x).
const PAD = FLOAT_AMP + 2;

let fail = 0;
console.log(`icon-check on ${file} (${png.width}x${png.height})`);
SIZZLE.different.tools.forEach((tool, k) => {
  const b = iconBbox(k);
  const x = b.left, y = b.top - PAD, w = ICON_SIZE, h = ICON_SIZE + 2 * PAD;

  if (tool.color === 'gemini-gradient') {
    // Locate the sparkle's ACTUAL vertical extent within the padded crop so the float
    // bob can't shift the split: first/last rows with ≥2 non-linen px (ignores stray AA).
    let yTop = -1, yBot = -1;
    for (let yy = Math.round(y); yy < y + h; yy++) {
      if (nonLinenCountInRow(png, x, w, yy) >= 2) {
        if (yTop < 0) yTop = yy;
        yBot = yy;
      }
    }
    // Sample the gradient's END regions (top/bottom tips), not the halves: the blue and
    // pink plateaus live at the ends; the sparkle's central mass is purple and must not
    // dominate the endpoint samples. Fall back to the padded crop if no glyph found.
    let upY = y, upH = h / 2, loY = y + h / 2, loH = h / 2;
    if (yTop >= 0 && yBot > yTop) {
      const H = yBot - yTop;
      const tip = Math.round(0.3 * H);
      upY = yTop; upH = tip;
      loY = yBot - tip; loH = tip;
    }
    const up = dominantNonLinen(png, x, upY, w, upH);
    const lo = dominantNonLinen(png, x, loY, w, loH);
    const hu = rgbToHsl(up).h, hl = rgbToHsl(lo).h;
    const diff = Math.min(Math.abs(hu - hl), 360 - Math.abs(hu - hl));
    const blue = [hu, hl].some((h) => h >= 200 && h <= 250);
    const pink = [hu, hl].some((h) => h >= 280 && h <= 340);
    const ok = diff >= 40 && blue && pink;
    if (!ok) fail++;
    console.log(
      `  ${tool.name.padEnd(11)} hues=[${fmt(hu)}°, ${fmt(hl)}°] Δhue=${fmt(diff)}° blue=${blue} pink=${pink} -> ${ok ? 'PASS' : 'FAIL'}`,
    );
  } else {
    const dom = dominantNonLinen(png, x, y, w, h);
    const de = deltaE2000(dom, hexToRgb(tool.color));
    const ok = de <= 18;
    if (!ok) fail++;
    console.log(
      `  ${tool.name.padEnd(11)} target=${tool.color} dom=rgb(${Math.round(dom.r)},${Math.round(dom.g)},${Math.round(dom.b)}) ΔE=${fmt(de)} -> ${ok ? 'PASS' : 'FAIL'}`,
    );
  }
});
console.log(fail === 0 ? 'ICON-CHECK: PASS' : `ICON-CHECK: FAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
