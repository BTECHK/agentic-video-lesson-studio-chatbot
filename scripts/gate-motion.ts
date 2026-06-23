/**
 * Gate Mo — motion/liveliness gate (the "not a slideshow" gate).
 *
 *   npm run gate:motion -- <path-to.mp4>
 *
 * Proves an MP4 actually animates THROUGHOUT, not just at beat transitions.
 * Samples low-res grayscale frames, measures adjacent-frame change, and fails if
 * too few frames change overall or any still is held longer than the limit.
 * Exits 0 on PASS, 1 on FAIL. Probe lives in src/lib/media-probe.ts (shared with
 * publish-to-drive); the pure verdict logic lives in src/lib/gate-motion.ts.
 */
import fs from 'node:fs';
import { runMain } from '../src/lib/logger';
import { evaluateMotion } from '../src/lib/gate-motion';
import { probeMotion } from '../src/lib/media-probe';

runMain('gate:motion', async (log) => {
  const mp4 = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!mp4) {
    log.error('usage: npm run gate:motion -- <path-to.mp4>');
    return 1;
  }
  if (!fs.existsSync(mp4)) {
    log.error(`file not found: ${mp4}`);
    return 1;
  }

  const facts = await probeMotion(mp4);
  const r = evaluateMotion(facts);

  log.info('motion facts', {
    mp4,
    samples: facts.diffs.length + 1,
    activePct: +r.activePct.toFixed(2),
    meanMotion: +r.meanMotion.toFixed(4),
    longestFrozenRunSec: +r.longestFrozenRunSec.toFixed(2),
  });

  if (r.verdict === 'PASS') {
    log.info('Gate Mo PASS — video stays alive throughout (not a slideshow)', { mp4 });
    return 0;
  }
  log.warn(`Gate Mo FAIL — ${r.reasons.join('; ')}`, { mp4 });
  return 1;
});
