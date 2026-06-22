/**
 * Render the SizzleManifesto promo MP4s (16:9 + 9:16) with tunable, high-quality
 * encode knobs. Sizzle-scoped — does NOT touch the lesson render path
 * (`render-lesson.ts`). The sizzle is a short, color-critical promo, so it defaults
 * to a much stronger CRF than lessons and exposes the pixel format for the AC9
 * color sweep (yuv420p vs yuv444p).
 *
 * Encode contract: h264 + BT.709 (the standard HD pipeline every player renders
 * correctly — a BT.601 tag is what desaturated the v2 sizzle). Teachable-playable,
 * < 2GB. `yuv444p` only ships if it still plays back.
 *
 * Usage:
 *   npx tsx scripts/render-sizzle.ts                 # both formats, defaults
 *   npx tsx scripts/render-sizzle.ts 16:9            # one format
 * Env:
 *   SIZZLE_CRF            x264 CRF (default 10 — strong; lessons use Remotion's default)
 *   SIZZLE_PIXEL_FORMAT  yuv420p (default) | yuv444p
 *   SIZZLE_OUT_DIR       output dir (default 'out/v2')
 *   RENDER_CONCURRENCY / RENDER_FRAME_TIMEOUT_MS  same knobs as render-lesson.ts
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const CRF = Number(process.env.SIZZLE_CRF ?? 10);
const PIXEL_FORMAT = (process.env.SIZZLE_PIXEL_FORMAT ?? 'yuv420p') as 'yuv420p' | 'yuv444p';
const OUT_DIR = process.env.SIZZLE_OUT_DIR ?? 'out/v2';
const CONCURRENCY = process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : undefined;
const FRAME_TIMEOUT_MS = Number(process.env.RENDER_FRAME_TIMEOUT_MS ?? 120_000);

const FORMATS: Array<{ format: '16:9' | '9:16'; file: string }> = [
  { format: '16:9', file: 'sizzle-16x9.mp4' },
  { format: '9:16', file: 'sizzle-9x16.mp4' },
];

function log(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...fields }));
}

async function main() {
  const only = process.argv[2] as '16:9' | '9:16' | undefined;
  const targets = only ? FORMATS.filter((f) => f.format === only) : FORMATS;
  fs.mkdirSync(path.join(process.cwd(), OUT_DIR), { recursive: true });
  log('sizzle.start', { crf: CRF, pixelFormat: PIXEL_FORMAT, outDir: OUT_DIR, formats: targets.map((t) => t.format) });

  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });

  for (const { format, file } of targets) {
    const out = path.join(process.cwd(), OUT_DIR, file);
    const composition = await selectComposition({ serveUrl, id: 'SizzleManifesto', inputProps: { format } });
    log('sizzle.render', { format, frames: composition.durationInFrames, out });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      colorSpace: 'bt709',
      crf: CRF,
      pixelFormat: PIXEL_FORMAT,
      outputLocation: out,
      inputProps: { format },
      timeoutInMilliseconds: FRAME_TIMEOUT_MS,
      ...(CONCURRENCY ? { concurrency: CONCURRENCY } : {}),
    });
    log('sizzle.done', { format, out });
  }
}

main().catch((err) => {
  log('sizzle.fatal', { error: String(err instanceof Error ? err.message : err) });
  process.exit(1);
});
