/**
 * Render full lesson MP4s (video + per-scene narration audio) via the LessonVideo
 * composition. Bundles once, then renders each requested lesson to out/<id>.mp4.
 *
 * Usage:
 *   npx tsx scripts/render-lesson.ts topic-1-lesson-1 topic-3-lesson-1   # specific
 *   npx tsx scripts/render-lesson.ts all                                  # every topic-* lesson
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { loadLesson } from '../src/lib/content-loader';

async function main() {
  const args = process.argv.slice(2);
  const lessonsDir = path.join(process.cwd(), 'content/lessons');
  const ids =
    args.length === 0 || args[0] === 'all'
      ? fs.readdirSync(lessonsDir).filter((d) => /^topic-\d+-lesson-\d+$/.test(d)).sort()
      : args;

  fs.mkdirSync(path.join(process.cwd(), 'out'), { recursive: true });
  console.log(`[render-lesson] Bundling once for ${ids.length} lesson(s)...`);
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });

  for (const [i, lessonId] of ids.entries()) {
    const lesson = await loadLesson(path.join(lessonsDir, lessonId, 'lesson.json'));
    const composition = await selectComposition({ serveUrl, id: 'LessonVideo', inputProps: { lesson } });
    const out = path.join(process.cwd(), 'out', `${lessonId}.mp4`);
    const t0 = Date.now();
    await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: out, inputProps: { lesson } });
    console.log(`[render-lesson] ${i + 1}/${ids.length} ${lessonId} -> ${out} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  console.log('[render-lesson] Done.');
}

main().catch((err) => {
  console.error('[render-lesson] ERROR:', err);
  process.exit(1);
});
