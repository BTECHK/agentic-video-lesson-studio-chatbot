/**
 * Lesson gate status — the keystone for "a lesson isn't done until A·B·C are green"
 * (LESSON-DEFINITION-OF-DONE.md). Pure: callers read the three review artifacts and
 * pass their contents. Both the publish block and the studio gate badges consume this.
 *
 * Convention: each gate artifact carries a machine-readable `Verdict: PASS|FIX` line
 * (Gate C already does; the Gate A/B runners emit the same). Missing file = not run.
 */

export type GateState = 'pass' | 'fix' | 'missing';

export interface GateDef {
  gate: 'A' | 'B' | 'C';
  name: string;
  /** path under content/lessons/<id>/ */
  artifact: string;
}

export const GATES: readonly GateDef[] = [
  { gate: 'A', name: 'Fidelity / Provenance / Freshness', artifact: 'review/FACT-CHECK-REPORT.md' },
  { gate: 'B', name: 'Teaching axis', artifact: 'review/teaching-axis.md' },
  { gate: 'C', name: 'Watch gate', artifact: 'review/watch-gate.md' },
] as const;

/** A present file with no PASS verdict counts as not-green; an absent file is "missing". */
export function parseGateState(md: string | null | undefined): GateState {
  if (md == null) return 'missing';
  const m = md.match(/verdict\s*[:-]?\s*(pass|fix|fail)/i);
  if (!m) return 'fix';
  return m[1].toLowerCase() === 'pass' ? 'pass' : 'fix';
}

export interface GateStatus extends GateDef {
  state: GateState;
}

export interface LessonGateSummary {
  lessonId: string;
  gates: GateStatus[];
  allGreen: boolean;
}

export function summarizeGates(
  lessonId: string,
  contents: { A: string | null; B: string | null; C: string | null },
): LessonGateSummary {
  const gates: GateStatus[] = GATES.map((g) => ({ ...g, state: parseGateState(contents[g.gate]) }));
  return { lessonId, gates, allGreen: gates.every((g) => g.state === 'pass') };
}

export interface PublishGateDecision {
  ok: boolean;
  reasons: string[];
}

/** Publish is allowed only when all three gates are green. */
export function canPublish(summary: LessonGateSummary): PublishGateDecision {
  if (summary.allGreen) return { ok: true, reasons: [] };
  const reasons = summary.gates
    .filter((g) => g.state !== 'pass')
    .map((g) => `Gate ${g.gate} (${g.name}): ${g.state === 'missing' ? 'not run' : 'not passing'} — ${g.artifact}`);
  return { ok: false, reasons };
}
