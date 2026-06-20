/**
 * Gate M — media integrity gate (audio present + audible, color tagged BT.709).
 *
 *   npm run gate:media -- <path-to.mp4>
 *
 * Probes the ACTUAL encoded MP4 (not a renderStill PNG) so silent or
 * mis-color-tagged output can never ship again. Exits 0 on PASS, 1 on FAIL.
 */
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { runMain } from '../src/lib/logger';
import { evaluateMedia, type MediaFacts } from '../src/lib/gate-media';

function hasAudio(mp4: string): boolean {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', mp4],
    { encoding: 'utf-8' },
  );
  return out.trim().length > 0;
}

function colorSpace(mp4: string): string {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=color_space', '-of', 'csv=p=0', mp4],
    { encoding: 'utf-8' },
  );
  // csv=p=0 can emit a trailing field separator → "bt470bg," — take the first token.
  return out.trim().split(/[\s,]+/)[0] || 'unknown';
}

/** Peak loudness (dBFS) via ffmpeg volumedetect; null if no audio / unreadable.
 *  volumedetect prints to STDERR and ffmpeg exits 0, so use spawnSync (captures
 *  both streams, never throws on a clean exit). */
function maxDb(mp4: string): number | null {
  const r = spawnSync('ffmpeg', ['-i', mp4, '-af', 'volumedetect', '-f', 'null', '-'], {
    encoding: 'utf-8',
  });
  const text = `${r.stderr ?? ''}${r.stdout ?? ''}`;
  const m = text.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  return m ? parseFloat(m[1]) : null;
}

runMain('gate:media', async (log) => {
  const mp4 = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!mp4) {
    log.error('usage: npm run gate:media -- <path-to.mp4>');
    return 1;
  }
  if (!fs.existsSync(mp4)) {
    log.error(`file not found: ${mp4}`);
    return 1;
  }

  const facts: MediaFacts = {
    hasAudioStream: hasAudio(mp4),
    maxDb: maxDb(mp4),
    colorSpace: colorSpace(mp4),
  };
  const result = evaluateMedia(facts);

  log.info('media facts', { mp4, ...facts });
  if (result.verdict === 'PASS') {
    log.info('Gate M PASS — audible audio + BT.709 color', { mp4 });
    return 0;
  }
  log.warn(`Gate M FAIL — ${result.reasons.join('; ')}`, { mp4 });
  return 1;
});
