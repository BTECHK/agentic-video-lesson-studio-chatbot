/**
 * THROWAWAY (AC5 smooth-float proof). Over the FIXED span of frames 600–660 of the
 * 16:9 render, track each chip's vertical position by cross-correlating its fixed
 * icon-column crop between consecutive frames (parabolic sub-pixel peak), and print
 * the per-chip Δy series + PASS/FAIL.
 *
 * PASS per chip (AC5): (a) mean |Δy| ≥ 0.4px OR tracked displacement range ≥ 4px (it
 * moves) — the cumulative-range metric is robust to per-frame sub-pixel under-read of a
 * genuinely smooth gentle float; (b) NO consecutive pair with |Δyᵢ| < 0.3 AND
 * |Δyᵢ₊₁| > 1.2 (the freeze-then-jump stair-step). Turning points OK.
 *
 * Frames must be extracted first (one PNG per frame, 1920×1080), e.g.:
 *   ffmpeg -i out/v2/sizzle-16x9.mp4 -vf "select='between(n,600,660)'" -vsync 0 \
 *     -start_number 600 frames/f%04d.png
 *
 * Usage:  npx tsx scripts/_sizzle-float-check.ts <framesDir> [pattern=f%04d.png] [start=600] [end=660]
 */
import path from 'node:path';
import { iconBbox, ICON_SIZE, FLOAT_AMP } from '../src/compositions/ColoredToolMark';
import { SIZZLE } from '../src/compositions/sizzle.storyboard';
import { readPng, pixel, fmt } from './_sizzle-color-lib';
import type { PNG } from 'pngjs';

const dir = process.argv[2];
const pattern = process.argv[3] ?? 'f%04d.png';
const START = Number(process.argv[4] ?? 600);
const END = Number(process.argv[5] ?? 660);
if (!dir) {
  console.error('usage: tsx scripts/_sizzle-float-check.ts <framesDir> [pattern] [start] [end]');
  process.exit(1);
}
const fname = (n: number) => pattern.replace(/%0(\d)d/, (_m, w) => String(n).padStart(Number(w), '0'));

// A vertical luminance profile of the icon column (mean luma per row over a band
// tall enough to contain the bobbing icon). Position is tracked by the shift that
// best aligns successive profiles.
function profile(png: PNG, x0: number, y0: number, w: number, h: number): number[] {
  const out: number[] = [];
  for (let y = y0; y < y0 + h; y++) {
    let s = 0, n = 0;
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      const p = pixel(png, x, y);
      s += 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
      n++;
    }
    out.push(n ? s / n : 0);
  }
  return out;
}

function sad(a: number[], b: number[], shift: number): number {
  let s = 0, n = 0;
  for (let i = 0; i < a.length; i++) {
    const j = i + shift;
    if (j < 0 || j >= b.length) continue;
    s += Math.abs(a[i] - b[j]); n++;
  }
  return n ? s / n : Infinity;
}

// Sub-pixel vertical shift between two profiles via parabolic interpolation around
// the integer SAD minimum (search ±MAXSHIFT rows).
function subpixelShift(a: number[], b: number[], maxShift: number): number {
  let best = 0, bestV = Infinity;
  for (let s = -maxShift; s <= maxShift; s++) {
    const v = sad(a, b, s);
    if (v < bestV) { bestV = v; best = s; }
  }
  const lm = sad(a, b, best - 1), rm = sad(a, b, best + 1);
  const denom = lm - 2 * bestV + rm;
  const frac = denom !== 0 ? (0.5 * (lm - rm)) / denom : 0;
  return best + Math.max(-1, Math.min(1, frac));
}

const PAD = FLOAT_AMP + 6;
const H = ICON_SIZE + 2 * PAD;
const MAXSHIFT = FLOAT_AMP + 4;

let anyFail = 0;
SIZZLE.different.tools.forEach((tool, k) => {
  const b = iconBbox(k);
  const x0 = Math.round(b.left), y0 = Math.round(b.top - PAD);
  let prev: number[] | null = null;
  const deltas: number[] = [];
  for (let n = START; n <= END; n++) {
    const png = readPng(path.join(dir, fname(n)));
    const prof = profile(png, x0, y0, ICON_SIZE, H);
    if (prev) deltas.push(subpixelShift(prev, prof, MAXSHIFT));
    prev = prof;
  }
  const meanAbs = deltas.reduce((s, d) => s + Math.abs(d), 0) / deltas.length;
  // Cumulative vertical position (running sum of sub-pixel shifts) → displacement range.
  let cum = 0, cumMin = 0, cumMax = 0;
  for (const d of deltas) { cum += d; if (cum < cumMin) cumMin = cum; if (cum > cumMax) cumMax = cum; }
  const range = cumMax - cumMin;
  let stair = false;
  for (let i = 0; i < deltas.length - 1; i++) {
    if (Math.abs(deltas[i]) < 0.3 && Math.abs(deltas[i + 1]) > 1.2) stair = true;
  }
  const moves = meanAbs >= 0.4 || range >= 4;
  const ok = moves && !stair;
  if (!ok) anyFail++;
  console.log(`  ${tool.name.padEnd(11)} mean|Δy|=${fmt(meanAbs)}px range=${fmt(range)}px stair=${stair} -> ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`     Δy: ${deltas.map((d) => fmt(d)).join(' ')}`);
});
console.log(anyFail === 0 ? 'FLOAT-CHECK: PASS' : `FLOAT-CHECK: FAIL (${anyFail})`);
process.exit(anyFail === 0 ? 0 : 1);
