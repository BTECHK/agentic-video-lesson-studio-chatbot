/**
 * Corpus enumeration + ledger formatting (pure; scripts/corpus-ledger.ts does I/O).
 *
 * The launch corpus = every topic-N-lesson-M plus the bonus lessons. Extra lesson families
 * are reported separately
 * rather than silently dropped — a ledger that hides rows recreates the exact
 * "a partial count reported as done" failure this file exists to prevent.
 */
import type { GateId, GateState } from './gate-status';

const CORPUS_RE = /^(topic-\d+-lesson-\d+|bonus-(intro|\d+))$/;
const EXTRA_RE = /^usecase-/;

export interface LedgerEntry {
  id: string;
  gates: Array<{ gate: GateId; state: GateState }>;
  ok: boolean;
}

/** Split lesson dir names into the launch corpus and tracked-but-excluded extras. */
export function corpusLessonIds(dirNames: string[]): { corpus: string[]; extra: string[] } {
  const corpus = dirNames.filter((d) => CORPUS_RE.test(d)).sort(lessonOrder);
  const extra = dirNames.filter((d) => EXTRA_RE.test(d)).sort();
  return { corpus, extra };
}

/** lesson 10 sorts after lesson 9 (numeric, not lexicographic). */
function lessonOrder(a: string, b: string): number {
  const num = (s: string) => s.match(/\d+/g)?.map(Number) ?? [];
  const [at, al] = num(a);
  const [bt, bl] = num(b);
  if (a.startsWith('bonus') !== b.startsWith('bonus')) return a.startsWith('bonus') ? 1 : -1;
  return at - bt || (al ?? 0) - (bl ?? 0);
}

const MARK: Record<GateState, string> = { pass: '✓', fix: '✗', missing: '—' };

/** One fixed-width ledger row: `topic-1-lesson-2   A✓ B✓ C✓ L✓ T✓  GREEN` */
export function ledgerRow(e: LedgerEntry): string {
  const cells = e.gates.map((g) => `${g.gate}${MARK[g.state]}`).join(' ');
  return `${e.id.padEnd(20)} ${cells}  ${e.ok ? 'GREEN' : 'NOT GREEN'}`;
}
