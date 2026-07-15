/**
 * Corpus review batch — Option C supervisor ("review everything, no skipping").
 *
 *   npm run corpus:review           # all corpus lessons, only their non-green gates
 *   npm run corpus:review -- t3l*   # (optional) ids as prefixes to scope a rerun
 *
 * For every corpus lesson (same enumerator as corpus:ledger) it runs ONLY the
 * gates that aren't already PASS, in cheap→expensive order: T (timing, local) →
 * L (layout probe) → C (watch gate) → A/B (headless-Claude judges, token-heavy).
 * Serial on purpose: gates spawn renders/ffmpeg and judges spawn `claude -p` —
 * parallelism here is what OOM-crashed past batches. Continues past failures,
 * logs per lesson, and finishes with corpus:ledger so the run ends in an N/N
 * printed count, never a narrative claim.
 *
 * DO NOT run while a video render is live (renders own the machine).
 * ponytail: serial loop, no retry ladder — rerun the command to retry stragglers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runMain } from '../src/lib/logger';
import { summarizeGates, GATES, type GateId } from '../src/lib/gate-status';
import { corpusLessonIds } from '../src/lib/corpus-ledger';

const CMD: Record<GateId, (id: string) => string[]> = {
  T: (id) => ['run', 'gate:timing', '--', id],
  L: (id) => ['run', 'gate:layout', '--', id],
  C: (id) => ['run', 'gate:lesson', '--', id],
  A: (id) => ['run', 'gate:review', '--', id, 'A', '--auto'],
  B: (id) => ['run', 'gate:review', '--', id, 'B', '--auto'],
};
const ORDER: GateId[] = ['T', 'L', 'C', 'A', 'B'];

runMain('corpus:review', async (log) => {
  const prefixes = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((p) => p.replace(/\*$/, ''));
  const lessonsRoot = path.join(process.cwd(), 'content', 'lessons');
  let { corpus } = corpusLessonIds(fs.readdirSync(lessonsRoot));
  if (prefixes.length > 0) corpus = corpus.filter((id) => prefixes.some((p) => id.startsWith(p)));

  for (const id of corpus) {
    const dir = path.join(lessonsRoot, id);
    const read = (rel: string): string | null => {
      const p = path.join(dir, rel);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    };
    const before = summarizeGates(
      id,
      Object.fromEntries(GATES.map((g) => [g.gate, read(g.artifact)])) as Parameters<typeof summarizeGates>[1],
    );
    const todo = ORDER.filter((g) => before.gates.find((s) => s.gate === g)?.state !== 'pass');
    if (todo.length === 0) {
      log.info(`${id}: already green — skipped`, { lessonId: id });
      continue;
    }
    log.info(`${id}: running gates ${todo.join(', ')}`, { lessonId: id });
    for (const g of todo) {
      const res = spawnSync('npm', CMD[g](id), { stdio: 'inherit', shell: true });
      if (res.status !== 0) log.warn(`${id}: gate ${g} runner exited ${res.status} — continuing`, { lessonId: id });
    }
  }

  const ledger = spawnSync('npm', ['run', 'corpus:ledger'], { stdio: 'inherit', shell: true });
  return ledger.status ?? 1;
});
