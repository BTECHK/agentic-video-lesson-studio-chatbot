/**
 * Rebuild the SizzleReel's media assets under public/sizzle/ (#74).
 *
 * These are git-ignored media (project policy: media → Drive, not git), so this
 * script regenerates them deterministically from a rendered lesson MP4:
 *   - payoff-lesson.mp4 : a 10s clean excerpt of the finished lesson (Layer B payoff).
 *   - music-bed.m4a     : a license-clean synthesized ambient bed (PLACEHOLDER —
 *                         swap in a real track and re-render; SizzleReel's `music`
 *                         prop is the seam).
 *
 * Usage (needs ffmpeg on PATH):
 *   1. Have a rendered lesson at out/<lesson>.mp4 (e.g. out/topic-1-lesson-1.mp4).
 *   2. npx tsx scripts/build-sizzle-assets.ts [sourceLessonMp4]
 *
 * Then render the reel:
 *   npx remotion render src/index.ts SizzleReel out/sizzle-16x9.mp4 \
 *     --props '{"format":"16:9","payoff":"sizzle/payoff-lesson.mp4","music":"sizzle/music-bed.m4a"}'
 *   (and --props '{"format":"9:16",...}' for the vertical cut)
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] ?? path.join('out', 'topic-1-lesson-1.mp4');
const OUT_DIR = path.join('public', 'sizzle');
const PAYOFF = path.join(OUT_DIR, 'payoff-lesson.mp4');
const MUSIC = path.join(OUT_DIR, 'music-bed.m4a');

function ffmpeg(args: string[]): void {
  const r = spawnSync('ffmpeg', ['-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) {
    console.error(`ffmpeg failed (exit ${r.status}) for: ${args.join(' ')}`);
    process.exit(1);
  }
}

if (!existsSync(SRC)) {
  console.error(`Source lesson MP4 not found: ${SRC}\nRender a lesson first, or pass a path as arg 1.`);
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

// Layer B payoff: 10s clean 1080p excerpt of the finished lesson (skip the lead-in).
ffmpeg([
  '-ss', '2', '-t', '10', '-i', SRC, '-an',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
  '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
  PAYOFF,
]);

// Placeholder ambient bed: low, warm A-major sine pad, lowpassed, slow tremolo, long fades.
ffmpeg([
  '-filter_complex',
  'sine=frequency=110:duration=60[a];sine=frequency=164.81:duration=60[b];' +
    'sine=frequency=220:duration=60[c];sine=frequency=277.18:duration=60[d];' +
    '[a][b][c][d]amix=inputs=4:duration=longest,tremolo=f=0.15:d=0.4,lowpass=f=900,' +
    'volume=0.10,afade=t=in:st=0:d=4,afade=t=out:st=56:d=4,' +
    'aformat=sample_rates=48000:channel_layouts=stereo[out]',
  '-map', '[out]', '-c:a', 'aac', '-b:a', '160k', MUSIC,
]);

console.log(`Built ${PAYOFF} and ${MUSIC}`);
