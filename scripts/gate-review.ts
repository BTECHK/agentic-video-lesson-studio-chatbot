/**
 * Gate A / B review runner (DoD Layers A and B).
 *
 *   npm run gate:review -- <id> A        verify tool claims vs official docs (accuracy sweep)
 *   npm run gate:review -- <id> B        judge teaching vs the lesson-plan
 *   npm run gate:review -- <id> B --auto  ...and have headless Claude Code write the verdict
 *
 * Default (collect) writes the judge prompt for an interactive judge; --auto drives
 * `claude -p` (no API key). Judge = Claude Code. Writes review/<artifact>.md with a
 * `Verdict:` line the gate-status aggregator reads. (Gate C uses gate:lesson.)
 */
import fs from 'node:fs';
import { runMain } from '../src/lib/logger';
import { runReview, type ReviewDeps, type ReviewGate } from '../src/lib/gate-review';
import { judgeViaClaudeCode } from '../src/lib/claude-judge';

runMain('gate:review', async (log) => {
  const args = process.argv.slice(2);
  const positionals = args.filter((a) => !a.startsWith('--'));
  const lessonId = positionals[0];
  const gate = (positionals[1] || '').toUpperCase() as ReviewGate;
  if (!lessonId || (gate !== 'A' && gate !== 'B')) {
    log.error('usage: npm run gate:review -- <lessonId> <A|B> [--auto]');
    return 1;
  }

  const deps: ReviewDeps = {
    cwd: process.cwd(),
    exists: (p) => fs.existsSync(p),
    ensureDir: (p) => fs.mkdirSync(p, { recursive: true }),
    readText: (p) => fs.readFileSync(p, 'utf-8'),
    writeText: (p, s) => fs.writeFileSync(p, s),
    judge: judgeViaClaudeCode,
    log,
  };

  const res = await runReview(lessonId, gate, { mode: args.includes('--auto') ? 'auto' : 'collect' }, deps);
  if (res.verdict === 'pending') {
    log.info(`Gate ${gate} collected (no verdict yet — collect mode).`, { lessonId });
    return 0;
  }
  log.info(`Gate ${gate} verdict: ${res.verdict}`, { lessonId, artifactPath: res.artifactPath });
  return 0;
});
