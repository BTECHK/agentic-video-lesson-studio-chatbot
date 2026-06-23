/**
 * Impure MP4 probes (ffprobe / ffmpeg / sharp) that feed the PURE gate evaluators
 * in gate-media.ts and gate-motion.ts. Kept separate from those modules so the
 * thresholds stay unit-testable without a rendered file. Shared by the gate
 * scripts AND publish-to-drive (so publishing probes the real video, not just
 * artifact files).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import sharp from 'sharp';
import type { MediaFacts } from './gate-media';
import type { MotionFacts } from './gate-motion';

export const MOTION_SAMPLE_FPS = 2; // one frame every 0.5s
const MW = 160;
const MH = 90;

/** ffprobe audio stream + color_space, ffmpeg volumedetect peak → MediaFacts. */
export function probeMedia(mp4: string): MediaFacts {
  const hasAudioStream =
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', mp4],
      { encoding: 'utf-8' },
    ).trim().length > 0;

  const colorSpace =
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=color_space', '-of', 'csv=p=0', mp4],
      { encoding: 'utf-8' },
    )
      .trim()
      .split(/[\s,]+/)[0] || 'unknown';

  // volumedetect prints to STDERR and ffmpeg exits 0 → spawnSync (never throws on clean exit).
  const r = spawnSync('ffmpeg', ['-i', mp4, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf-8' });
  const text = `${r.stderr ?? ''}${r.stdout ?? ''}`;
  const m = text.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  const maxDb = m ? parseFloat(m[1]) : null;

  return { hasAudioStream, maxDb, colorSpace };
}

/** Extract low-res grayscale frames and return adjacent-frame luma diffs → MotionFacts. */
export async function probeMotion(mp4: string): Promise<MotionFacts> {
  const dir = path.join(os.tmpdir(), `motion-${path.basename(mp4)}-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    execFileSync('ffmpeg', [
      '-v', 'error', '-y',
      '-i', mp4,
      '-vf', `fps=${MOTION_SAMPLE_FPS},scale=${MW}:${MH},format=gray`,
      path.join(dir, 'f%04d.png'),
    ]);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .map((f) => path.join(dir, f));

    const bufs: Buffer[] = [];
    let channels = 1;
    for (const f of files) {
      const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
      bufs.push(data);
      channels = info.channels;
    }
    const diffs: number[] = [];
    for (let i = 1; i < bufs.length; i++) {
      const a = bufs[i - 1];
      const b = bufs[i];
      const px = Math.floor(a.length / channels);
      let sum = 0;
      for (let p = 0; p < a.length; p += channels) sum += Math.abs(a[p] - b[p]);
      diffs.push(sum / px / 255);
    }
    return { diffs, sampleFps: MOTION_SAMPLE_FPS };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
