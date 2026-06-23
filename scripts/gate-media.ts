/**
 * Gate M — media integrity gate (audio present + audible, color tagged BT.709).
 *
 *   npm run gate:media -- <path-to.mp4>
 *
 * Probes the ACTUAL encoded MP4 (not a renderStill PNG) so silent or
 * mis-color-tagged output can never ship again. Exits 0 on PASS, 1 on FAIL.
 */
import fs from 'node:fs';
import { runMain } from '../src/lib/logger';
import { evaluateMedia } from '../src/lib/gate-media';
import { probeMedia } from '../src/lib/media-probe';

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

  const facts = probeMedia(mp4);
  const result = evaluateMedia(facts);

  log.info('media facts', { mp4, ...facts });
  if (result.verdict === 'PASS') {
    log.info('Gate M PASS — audible audio + BT.709 color', { mp4 });
    return 0;
  }
  log.warn(`Gate M FAIL — ${result.reasons.join('; ')}`, { mp4 });
  return 1;
});
