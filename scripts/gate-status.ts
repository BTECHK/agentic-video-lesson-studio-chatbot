/**
 * Lesson gate status / publish precondition (DoD Layer A·B·C enforcement).
 *
 *   npm run gate:status -- <id>
 *
 * Reads the five review artifacts (FACT-CHECK-REPORT.md / teaching-axis.md /
 * watch-gate.md / layout-gate.md / timing-gate.md), prints each gate's state,
 * and exits 0 only when all five are green — so it can gate a Teachable-export step. It does NOT touch the review
 * bundle (publish-lesson.ts): that bundle is how Instructor reviews, which is what makes
 * Gate C pass — blocking it would deadlock. Publish stays a human action; this is
 * the precondition the human (or the studio button) checks first.
 *
 * Freshness: C/L/T judge the RENDERED MP4, so if their artifact's mtime predates
 * the MP4's mtime (a re-render happened after the gate ran), the gate reads
 * [STALE] and does NOT count as green — same as FIX/MISS for the publish decision.
 * A/B judge lesson content, not the render, so they're unaffected by MP4 mtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runMain } from '../src/lib/logger';
import { summarizeGates, canPublish } from '../src/lib/gate-status';

const MARK: Record<string, string> = { pass: 'PASS', fix: 'FIX ', missing: 'MISS', stale: 'STALE' };

runMain('gate:status', async (log) => {
  const lessonId = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!lessonId) {
    log.error('usage: npm run gate:status -- <lessonId>');
    return 1;
  }
  const lessonDir = path.join(process.cwd(), 'content', 'lessons', lessonId);
  const read = (rel: string): string | null => {
    const p = path.join(lessonDir, rel);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
  };
  const mtimeMs = (p: string): number | null => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : null);

  const summary = summarizeGates(
    lessonId,
    {
      A: read('review/FACT-CHECK-REPORT.md'),
      B: read('review/teaching-axis.md'),
      C: read('review/watch-gate.md'),
      L: read('review/layout-gate.md'),
      T: read('review/timing-gate.md'),
    },
    {
      // Honors RENDER_OUT_DIR like render-lesson.ts (renders live in out/v3).
      mp4: mtimeMs(path.join(process.cwd(), process.env.RENDER_OUT_DIR ?? 'out', `${lessonId}.mp4`)),
      C: mtimeMs(path.join(lessonDir, 'review/watch-gate.md')),
      L: mtimeMs(path.join(lessonDir, 'review/layout-gate.md')),
      T: mtimeMs(path.join(lessonDir, 'review/timing-gate.md')),
    },
  );

  for (const g of summary.gates) {
    log.info(`Gate ${g.gate} [${MARK[g.state]}] ${g.name}`, { artifact: g.artifact });
  }

  const decision = canPublish(summary);
  if (decision.ok) {
    log.info('PUBLISH OK — all five gates green', { lessonId });
    return 0;
  }
  for (const r of decision.reasons) log.warn(r);
  log.warn('PUBLISH BLOCKED — not all gates green', { lessonId });
  return 1;
});
