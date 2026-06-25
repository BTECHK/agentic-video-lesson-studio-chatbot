/**
 * Focused verification: render ONE settled still (5s into the scene) for only
 * the scene types passed on the CLI, via the real LessonVideo composition (so
 * chrome + captions match what keyframe QC sees). Avoids re-rendering every
 * scene in a lesson.
 *
 * Usage: tsx scripts/render-scene-stills.ts <lessonId> <type[,type...]> <outDir>
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { loadLesson } from '../src/lib/content-loader';

const FPS = 30;
const SETTLE_SECONDS = 5;

async function main() {
  const lessonId = process.argv[2];
  const types = (process.argv[3] || '').split(',').filter(Boolean);
  const outDir = process.argv[4] || path.join(process.cwd(), 'out/scene-stills');
  if (!lessonId || types.length === 0) {
    throw new Error('usage: tsx scripts/render-scene-stills.ts <lessonId> <type,...> <outDir>');
  }

  const lessonPath = path.join(process.cwd(), 'content/lessons', lessonId, 'lesson.json');
  const lesson = await loadLesson(lessonPath);
  fs.mkdirSync(outDir, { recursive: true });

  console.log('[stills] Bundling...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: 'LessonVideo', inputProps: { lesson } });

  for (const scene of lesson.scenes) {
    if (!types.includes(scene.type)) continue;
    const offset = Math.min(SETTLE_SECONDS * FPS, scene.duration - 1);
    const frame = scene.start + offset;
    const output = path.join(outDir, `AFTER-${lessonId}-${scene.type}-${scene.id}.png`);
    await renderStill({ composition, serveUrl, output, frame, imageFormat: 'png', inputProps: { lesson } });
    console.log(`[stills] ${scene.type} (${scene.id}) @ frame ${frame} -> ${output}`);
  }

  console.log('[stills] Done.');
}

main().catch((err) => {
  console.error('[stills] ERROR:', err);
  process.exit(1);
});
