/**
 * THROWAWAY (AC9 color proof). Two ΔE gates over a fixed patch set:
 *   (a) VALUES — renderStill PNG patches vs the DESIGN target hexes (catches a wrong
 *       token value). Pass: mean CIE2000 ΔE ≤ 5 per patch.
 *   (b) ENCODE — the encoded-MP4 frame patches vs the SAME-frame renderStill PNG
 *       (catches encode loss). Pass: mean ΔE ≤ 6 per patch.
 *
 * Patches: linen bg + crimson accent + the 4 icon colors (from the `different`
 * frame), and the dark-transform bg (from the `transform` frame). Icon patches are
 * cropped by the shared icon-bbox geometry; bg/accent from fixed safe regions.
 *
 * Usage:
 *   npx tsx scripts/_sizzle-color-de.ts \
 *     <different.still.png> <different.mp4.png> [transform.still.png] [transform.mp4.png]
 */
import { iconBbox, ICON_SIZE, FLOAT_AMP } from '../src/compositions/ColoredToolMark';
import { SIZZLE } from '../src/compositions/sizzle.storyboard';
import { readPng, hexToRgb, deltaE2000, dominantNonLinen, meanRgb, fmt, type RGB } from './_sizzle-color-lib';
import type { PNG } from 'pngjs';

const [stillDiff, mp4Diff, stillTf, mp4Tf] = process.argv.slice(2);
if (!stillDiff || !mp4Diff) {
  console.error('usage: tsx scripts/_sizzle-color-de.ts <different.still.png> <different.mp4.png> [transform.still.png] [transform.mp4.png]');
  process.exit(1);
}

type Patch = { name: string; design: string; sample: (png: PNG) => RGB; frame: 'different' | 'transform' };
const PAD = FLOAT_AMP + 2;
const iconSampler = (k: number) => (png: PNG): RGB => {
  const b = iconBbox(k);
  return dominantNonLinen(png, b.left, b.top - PAD, ICON_SIZE, ICON_SIZE + 2 * PAD);
};

const patches: Patch[] = [
  { name: 'linen bg', design: '#EDE8E3', frame: 'different', sample: (p) => meanRgb(p, 40, 40, 60, 60) },
  // Crimson accent — the chip-row connector DrawLine is a full-width crimson rule at
  // a deterministic absolute Y (~CHIP_ROW_TOP + chip height + 16). Dominant non-linen
  // over a band there is the accent (the only chromatic color in the system).
  { name: 'accent', design: '#8B2635', frame: 'different', sample: (p) => dominantNonLinen(p, 200, 790, 600, 24) },
  ...SIZZLE.different.tools
    .map((t, k) => ({ t, k }))
    .filter(({ t }) => t.color !== 'gemini-gradient')
    .map(({ t, k }) => ({
      name: `${t.name} icon`,
      design: t.color,
      frame: 'different' as const,
      sample: iconSampler(k),
    })),
  { name: 'dark bg', design: '#191717', frame: 'transform', sample: (p) => meanRgb(p, 40, 40, 60, 60) },
];

const diffStill = readPng(stillDiff), diffMp4 = readPng(mp4Diff);
const tfStill = stillTf ? readPng(stillTf) : null;
const tfMp4 = mp4Tf ? readPng(mp4Tf) : null;

let failV = 0, failE = 0;
console.log('patch            design    still rgb        ΔE(val)  ΔE(enc)');
for (const p of patches) {
  const still = p.frame === 'different' ? diffStill : tfStill;
  const mp4 = p.frame === 'different' ? diffMp4 : tfMp4;
  if (!still || !mp4) {
    console.log(`  ${p.name.padEnd(14)} (skipped — no ${p.frame} frame provided)`);
    continue;
  }
  const sR = p.sample(still), mR = p.sample(mp4);
  const dv = deltaE2000(sR, hexToRgb(p.design));
  const de = deltaE2000(mR, sR);
  if (dv > 5) failV++;
  if (de > 6) failE++;
  console.log(
    `  ${p.name.padEnd(14)} ${p.design}  rgb(${Math.round(sR.r)},${Math.round(sR.g)},${Math.round(sR.b)})`.padEnd(48) +
      ` ${fmt(dv).padStart(6)}  ${fmt(de).padStart(6)}  ${dv <= 5 && de <= 6 ? 'PASS' : 'FAIL'}`,
  );
}
console.log(`VALUES gate (ΔE≤5): ${failV === 0 ? 'PASS' : `FAIL (${failV})`}`);
console.log(`ENCODE gate (ΔE≤6): ${failE === 0 ? 'PASS' : `FAIL (${failE})`}`);
process.exit(failV === 0 && failE === 0 ? 0 : 1);
