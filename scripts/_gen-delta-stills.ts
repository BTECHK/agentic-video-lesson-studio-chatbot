/**
 * THROWAWAY. Generate true-color, uncompressed renderStill PNGs of specific
 * LessonVideo frames, using the SAME loadLesson() path as render-lesson.ts so the
 * stills correspond exactly to the MP4 frames at the same frame numbers. Used to
 * build the claude-design-delta comparison bundle (uncompressed render vs h264 MP4).
 *
 * Usage: npx tsx scripts/_gen-delta-stills.ts
 */
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { loadLesson } from '../src/lib/content-loader';

const LESSON = 'topic-1-lesson-1';
const FRAMES = [150, 2200, 3300];
const OUT = path.join(process.cwd(), 'claude-design-delta', 'frames');

async function main() {
  const lesson = await loadLesson(path.join(process.cwd(), 'content/lessons', LESSON, 'lesson.json'));
  const serveUrl = await bundle({ entryPoint: path.join(process.cwd(), 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: 'LessonVideo', inputProps: { lesson } });
  for (const frame of FRAMES) {
    const output = path.join(OUT, `renderstill_f${frame}.png`);
    await renderStill({ composition, serveUrl, output, frame, inputProps: { lesson } });
    console.log(JSON.stringify({ event: 'still.done', frame, output }));
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
