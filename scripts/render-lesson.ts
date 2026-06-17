/**
 * Render full lesson MP4s (video + per-scene narration audio) via the LessonVideo
 * composition. Bundles once, then renders each requested lesson to out/<id>.mp4.
 *
 * Hardened for unattended batch runs:
 *  - per-lesson try/catch — one failure never aborts the batch; failures collected.
 *  - per-lesson wall-clock watchdog (cancelSignal) — a hung render is cancelled,
 *    not left to block the queue forever.
 *  - JSON-line structured logging (start / progress / done / failed / timeout) so a
 *    stuck or slow render is visible in the log tail.
 *  - non-zero exit if any lesson failed, so callers/CI can detect partial batches.
 *
 * Usage:
 *   npx tsx scripts/render-lesson.ts topic-1-lesson-1 topic-3-lesson-1   # specific
 *   npx tsx scripts/render-lesson.ts all                                  # every topic-* lesson
 * Env:
 *   RENDER_TIMEOUT_MIN  per-lesson watchdog in minutes (default 40)
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, makeCancelSignal } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { loadLesson } from '../src/lib/content-loader';

const TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MIN ?? 40) * 60_000;

/** One grep-able JSON line per event. */
function log(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...fields }));
}

async function renderOne(serveUrl: string, lessonsDir: string, lessonId: string): Promise<boolean> {
  const out = path.join(process.cwd(), 'out', `${lessonId}.mp4`);
  const { cancelSignal, cancel } = makeCancelSignal();
  let timedOut = false;
  const watchdog = setTimeout(() => {
    timedOut = true;
    log('render.timeout', { lessonId, timeoutMin: TIMEOUT_MS / 60_000 });
    cancel();
  }, TIMEOUT_MS);
  const t0 = Date.now();
  let lastPct = -1;
  try {
    const lesson = await loadLesson(path.join(lessonsDir, lessonId, 'lesson.json'));
    const composition = await selectComposition({ serveUrl, id: 'LessonVideo', inputProps: { lesson } });
    log('render.start', { lessonId, frames: composition.durationInFrames });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: out,
      inputProps: { lesson },
      cancelSignal,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 100);
        if (pct >= lastPct + 20) {
          lastPct = pct;
          log('render.progress', { lessonId, pct });
        }
      },
    });
    clearTimeout(watchdog);
    log('render.done', { lessonId, out, sec: Math.round((Date.now() - t0) / 1000) });
    return true;
  } catch (err) {
    clearTimeout(watchdog);
    log(timedOut ? 'render.failed_timeout' : 'render.failed', {
      lessonId,
      sec: Math.round((Date.now() - t0) / 1000),
      error: String(err instanceof Error ? err.message : err),
    });
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const lessonsDir = path.join(process.cwd(), 'content/lessons');
  const ids =
    args.length === 0 || args[0] === 'all'
      ? fs.readdirSync(lessonsDir).filter((d) => /^topic-\d+-lesson-\d+$/.test(d)).sort()
      : args;

  fs.mkdirSync(path.join(process.cwd(), 'out'), { recursive: true });
  log('batch.start', { count: ids.length, timeoutMin: TIMEOUT_MS / 60_000 });
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });

  const failed: string[] = [];
  for (const lessonId of ids) {
    const ok = await renderOne(serveUrl, lessonsDir, lessonId);
    if (!ok) failed.push(lessonId);
  }

  log('batch.done', { total: ids.length, rendered: ids.length - failed.length, failed });
  if (failed.length > 0) {
    console.error(`[render-lesson] FAILED: ${failed.join(', ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  log('batch.fatal', { error: String(err instanceof Error ? err.message : err) });
  process.exit(1);
});
