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
  // --auto: drive the Claude judge to a VERDICT (bare gate:lesson is collect-only
  // and leaves Gate C 'missing' forever — the round-2 no-op bug). The watch sensor
  // auto-falls-back to frames-only when the Gemini free-tier quota (20/day) is spent.
  C: (id) => ['run', 'gate:lesson', '--', id, '--auto'],
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

  spawnSync('npm', ['run', 'corpus:ledger'], { stdio: 'inherit', shell: true });

  // Re-derive the verdict HERE (don't trust the shelled exit — on Windows the
  // shell:true wrapper swallowed corpus:ledger's exit 1, letting round 2 report
  // a false success at 13/38). The batch is green only when every corpus lesson
  // reads green from the live artifacts right now.
  const { corpus: allIds } = corpusLessonIds(fs.readdirSync(lessonsRoot));
  const notGreen = allIds.filter((id) => {
    const dir = path.join(lessonsRoot, id);
    const s = summarizeGates(
      id,
      Object.fromEntries(
        GATES.map((g) => [g.gate, fs.existsSync(path.join(dir, g.artifact)) ? fs.readFileSync(path.join(dir, g.artifact), 'utf-8') : null]),
      ) as Parameters<typeof summarizeGates>[1],
    );
    return s.gates.some((x) => x.state !== 'pass');
  });
  if (notGreen.length > 0) log.warn(`NOT green (${notGreen.length}): ${notGreen.join(', ')}`);
  return notGreen.length === 0 ? 0 : 1;
});
