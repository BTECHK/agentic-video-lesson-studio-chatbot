/**
 * Render verification probe (H0 item 4).
 *
 * Proves the Remotion pipeline produces real frames, not just valid JSON.
 * Bundles the project, renders a few settled stills from a real composition,
 * and asserts every frame is non-blank. Fast (stills only, no MP4) so it can
 * run as a quick gate; the full Module-1 MP4 verification arrives with Phase E.
 *
 * Usage: npm run verify:render [compositionId]   (default: BrandShowcase)
 * Exit 0 = all probe frames non-blank; exit 1 = blank/failed render.
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { detectBlankFrame } from './verify';
import { SCENES, getScreenshotFrames } from './render';

const DEFAULT_COMPOSITION = 'BrandShowcase';
const OUT_DIR = path.join(process.cwd(), 'out/verify/screenshots');

export interface ProbeResult {
  composition: string;
  frames: { frame: number; path: string; blank: boolean }[];
  passed: boolean;
}

export async function verifyRender(
  compositionId: string = DEFAULT_COMPOSITION,
): Promise<ProbeResult> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[verify-render] Bundling ${compositionId}...`);
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), 'src/index.ts'),
  });

  const composition = await selectComposition({ serveUrl, id: compositionId });

  // One settled frame from the middle of each scene (animations have eased in).
  const probeFrames = SCENES.map((scene) => getScreenshotFrames(scene)[1]);

  const frames: ProbeResult['frames'] = [];
  for (const frame of probeFrames) {
    const output = path.join(OUT_DIR, `${compositionId}-frame-${frame}.png`);
    await renderStill({ composition, serveUrl, output, frame, imageFormat: 'png' });
    const blank = await detectBlankFrame(output);
    frames.push({ frame, path: output, blank });
    console.log(
      `[verify-render] frame ${frame}: ${blank ? 'BLANK ✗' : 'non-blank ✓'} -> ${output}`,
    );
  }

  const passed = frames.length > 0 && frames.every((f) => !f.blank);
  return { composition: compositionId, frames, passed };
}

if (require.main === module) {
  const compositionId = process.argv[2] || DEFAULT_COMPOSITION;
  verifyRender(compositionId)
    .then((result) => {
      if (result.passed) {
        console.log(
          `[verify-render] PASS — ${result.frames.length} non-blank frames from ${result.composition}`,
        );
        process.exit(0);
      }
      console.error('[verify-render] FAIL — blank or missing frames detected');
      process.exit(1);
    })
    .catch((err) => {
      console.error('[verify-render] ERROR:', err);
      process.exit(1);
    });
}
