/**
 * Lesson gate status — the keystone for "a lesson isn't done until A·B·C are green"
 * (LESSON-DEFINITION-OF-DONE.md). Pure: callers read the three review artifacts and
 * pass their contents. Both the publish block and the studio gate badges consume this.
 *
 * Convention: each gate artifact carries a machine-readable `Verdict: PASS|FIX` line
 * (Gate C already does; the Gate A/B runners emit the same). Missing file = not run.
 * Gate T uses `Verdict: WARN` for the 60–130% band — the regex does not match WARN
 * so it counts as not-green, matching FIX semantics for publish gating.
 */

export type GateState = 'pass' | 'fix' | 'missing' | 'stale';

export type GateId = 'A' | 'B' | 'C' | 'L' | 'T';

/**
 * Gates that judge the RENDERED MP4 (vs A/B, which judge lesson content and don't
 * go stale from a re-render). A watch-gate/layout-gate/timing-gate artifact older
 * than the MP4 it's supposed to have judged was written against a different render.
 */
export const MP4_JUDGED_GATES: readonly GateId[] = ['C', 'L', 'T'];

export interface GateDef {
  gate: GateId;
  name: string;
  /** path under content/lessons/<id>/ */
  artifact: string;
}

export const GATES: readonly GateDef[] = [
  { gate: 'A', name: 'Fidelity / Provenance / Freshness', artifact: 'review/FACT-CHECK-REPORT.md' },
  { gate: 'B', name: 'Teaching axis', artifact: 'review/teaching-axis.md' },
  { gate: 'C', name: 'Watch gate', artifact: 'review/watch-gate.md' },
  { gate: 'L', name: 'Layout integrity', artifact: 'review/layout-gate.md' },
  { gate: 'T', name: 'Timing integrity', artifact: 'review/timing-gate.md' },
] as const;

/**
 * A present file with no PASS verdict counts as not-green; an absent file is "missing".
 * Artifact contract (Codex BLOCK 2026-07-15): the verdict must be the FIRST non-empty
 * line. A Verdict: buried under judge preamble no longer parses — fail-closed as 'fix'
 * until the artifact is normalized (claude-judge stripJudgePreamble does this at write).
 */
export function parseGateState(md: string | null | undefined): GateState {
  if (md == null) return 'missing';
  const first = md.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  const m = first.match(/^\s*verdict\s*[:-]?\s*(pass|fix|fail)/i);
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

/**
 * mtimes (ms since epoch) for the MP4-freshness check. `mp4: null` (absent MP4,
 * or the arg omitted entirely) leaves current behavior unchanged — no staleness
 * is applied. Per-gate mtimes are only consulted for MP4_JUDGED_GATES.
 */
export interface GateMtimes {
  mp4: number | null;
  A?: number | null;
  B?: number | null;
  C?: number | null;
  L?: number | null;
  T?: number | null;
}

export function summarizeGates(
  lessonId: string,
  contents: { A: string | null; B: string | null; C: string | null; L: string | null; T: string | null },
  mtimes?: GateMtimes,
): LessonGateSummary {
  const gates: GateStatus[] = GATES.map((g) => {
    const state = parseGateState(contents[g.gate]);
    const artifactMtime = mtimes?.[g.gate];
    const isStale =
      state !== 'missing' &&
      mtimes?.mp4 != null &&
      MP4_JUDGED_GATES.includes(g.gate) &&
      artifactMtime != null &&
      artifactMtime < mtimes.mp4;
    return { ...g, state: isStale ? 'stale' : state };
  });
  return { lessonId, gates, allGreen: gates.every((g) => g.state === 'pass') };
}

export interface PublishGateDecision {
  ok: boolean;
  reasons: string[];
}

/** Publish is allowed only when all five gates are green. */
export function canPublish(summary: LessonGateSummary): PublishGateDecision {
  if (summary.allGreen) return { ok: true, reasons: [] };
  const why: Record<Exclude<GateState, 'pass'>, string> = {
    missing: 'not run',
    stale: 'stale — artifact predates the rendered MP4',
    fix: 'not passing',
  };
  const reasons = summary.gates
    .filter((g) => g.state !== 'pass')
    .map((g) => `Gate ${g.gate} (${g.name}): ${why[g.state as Exclude<GateState, 'pass'>]} — ${g.artifact}`);
  return { ok: false, reasons };
}
