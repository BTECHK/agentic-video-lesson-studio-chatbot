import fs from 'fs';
import path from 'path';

/**
 * Studio-facing read of a lesson's five Definition-of-Done gates (A·B·C·L·T) from
 * its review artifacts. Mirrors the convention in the root `src/lib/gate-status.ts`
 * (each artifact carries a `Verdict: PASS|FIX` line; absent file = not run). Kept
 * chatbot-local because this package builds separately from the root pipeline.
 *
 * Note: Gate T uses `Verdict: WARN` for the warn band — parseGateState treats it as
 * 'fix' (not-green) since the regex only matches pass|fix|fail. This is intentional.
 */

export type GateState = 'pass' | 'fix' | 'missing';

export interface GateBadge {
  gate: 'A' | 'B' | 'C' | 'L' | 'T';
  label: string;
  state: GateState;
}

export interface LessonGates {
  gates: GateBadge[];
  allGreen: boolean;
}

const GATE_FILES: { gate: 'A' | 'B' | 'C' | 'L' | 'T'; label: string; file: string }[] = [
  { gate: 'A', label: 'Accuracy', file: 'FACT-CHECK-REPORT.md' },
  { gate: 'B', label: 'Teaching', file: 'teaching-axis.md' },
  { gate: 'C', label: 'Watch', file: 'watch-gate.md' },
  { gate: 'L', label: 'Layout', file: 'layout-gate.md' },
  { gate: 'T', label: 'Timing', file: 'timing-gate.md' },
];

const LESSONS_DIR = path.join(process.cwd(), '..', 'content', 'lessons');

/** A present file with no PASS verdict is not-green; an absent file is "missing". */
export function parseGateState(md: string | null): GateState {
  if (md == null) return 'missing';
  const m = md.match(/verdict\s*[:-]?\s*(pass|fix|fail)/i);
  if (!m) return 'fix';
  return m[1].toLowerCase() === 'pass' ? 'pass' : 'fix';
}

export function getLessonGates(lessonId: string): LessonGates {
  const reviewDir = path.join(LESSONS_DIR, lessonId, 'review');
  const gates: GateBadge[] = GATE_FILES.map((g) => {
    const p = path.join(reviewDir, g.file);
    const md = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
    return { gate: g.gate, label: g.label, state: parseGateState(md) };
  });
  return { gates, allGreen: gates.every((g) => g.state === 'pass') };
}
