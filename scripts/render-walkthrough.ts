/**
 * Render the PlatformWalkthrough MP4 with the same encode contract as the sizzle
 * (h264 + BT.709 + CRF + SSAA). Prevents the bt470bg regression: the old bare
 * `npx remotion render` command had no `--color-space` flag, which is the
 * confirmed root cause of the walkthrough's desaturated color tag.
 *
 * Usage:
 *   npx tsx scripts/render-walkthrough.ts
 * Env:
 *   WALKTHROUGH_CRF       x264 CRF (default 18, matches render-lesson.ts)
 *   WALKTHROUGH_OUT       output path (default 'output/video/platform-walkthrough.mp4')
 *   RENDER_CONCURRENCY / RENDER_FRAME_TIMEOUT_MS  same knobs as render-lesson.ts / render-sizzle.ts
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const CRF = Number(process.env.WALKTHROUGH_CRF ?? 18);
// Supersample (SSAA): render at 2× backing resolution for crisp downscaled delivery.
const RENDER_SCALE = Number(process.env.RENDER_SCALE ?? 2);
const OUT = process.env.WALKTHROUGH_OUT ?? 'output/video/platform-walkthrough.mp4';
const CONCURRENCY = process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : undefined;
const FRAME_TIMEOUT_MS = Number(process.env.RENDER_FRAME_TIMEOUT_MS ?? 120_000);

function log(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...fields }));
}

async function main() {
  const out = path.join(process.cwd(), OUT);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  log('walkthrough.start', { crf: CRF, out });

  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: 'PlatformWalkthrough' });
  log('walkthrough.render', { frames: composition.durationInFrames, out });

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    colorSpace: 'bt709',
    crf: CRF,
    x264Preset: 'slow',
    scale: RENDER_SCALE,
    pixelFormat: 'yuv420p',
    outputLocation: out,
    timeoutInMilliseconds: FRAME_TIMEOUT_MS,
    ...(CONCURRENCY ? { concurrency: CONCURRENCY } : {}),
  });
  log('walkthrough.done', { out });
}

main().catch((err) => {
  log('walkthrough.fatal', { error: String(err instanceof Error ? err.message : err) });
  process.exit(1);
});
