/**
 * Per-scene visual verification for a LessonVideo render.
 *
 * Bundles once, then renders one settled still (~5s into each scene, after the
 * entrance beats have eased in) for every scene in the lesson. Output lands in
 * out/lesson-stills/ for human review — satisfies the "every rendered scene
 * needs human-reviewable screenshots" hard rule for Phase C-2.
 *
 * Usage: tsx scripts/render-lesson-stills.ts [lessonId]   (default: module-1)
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { loadLesson } from '../src/lib/content-loader';

const FPS = 30;
const SETTLE_SECONDS = 5;

async function main() {
  const lessonId = process.argv[2] || 'module-1';
  const lessonPath = path.join(process.cwd(), 'content/lessons', lessonId, 'lesson.json');
  const lesson = await loadLesson(lessonPath);

  const outDir = path.join(process.cwd(), 'out/lesson-stills', lessonId);
  fs.mkdirSync(outDir, { recursive: true });

  console.log('[stills] Bundling...');
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });
  const composition = await selectComposition({
    serveUrl,
    id: 'LessonVideo',
    inputProps: { lesson },
  });

  for (const [i, scene] of lesson.scenes.entries()) {
    // Settle frame, clamped to stay inside the scene.
    const offset = Math.min(SETTLE_SECONDS * FPS, scene.duration - 1);
    const frame = scene.start + offset;
    const output = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${scene.type}-${scene.id}.png`);
    await renderStill({ composition, serveUrl, output, frame, imageFormat: 'png', inputProps: { lesson } });
    console.log(`[stills] scene ${i + 1}/${lesson.scenes.length} (${scene.type}) @ frame ${frame} -> ${output}`);
  }

  console.log(`[stills] Done — ${lesson.scenes.length} stills in ${outDir}`);
}

main().catch((err) => {
  console.error('[stills] ERROR:', err);
  process.exit(1);
});
