/**
 * Gate T — timing integrity. Pure logic: no I/O, no ffprobe, no filesystem.
 *
 * Compares a rendered MP4's duration against the lesson's outline target
 * (lesson.minutes from course-map.json × 60). Thresholds:
 *
 *   Zone        Condition                              Verdict
 *   PASS        75% ≤ ratio ≤ 120%                     PASS
 *   WARN-low    60% ≤ ratio < 75%                      WARN
 *   WARN-high   120% < ratio ≤ 130%                    WARN
 *   FAIL-low    ratio < 60%                            FIX
 *   FAIL-high   ratio > 130%                           FIX
 *
 * Note: parseGateState in gate-status.ts does not match "WARN" (the regex is
 * /pass|fix|fail/i), so WARN counts as not-green for canPublish — intentional.
 * The CLI exits 0 on WARN (informational) and 1 on FIX (must fix).
 */

export type TimingVerdict = 'PASS' | 'WARN' | 'FIX';

export interface TimingGateInput {
  lessonId: string;
  durationSec: number; // from ffprobe
  outlineMinutes: number; // lesson.minutes from course-map.json (top-level field, not row sums)
}

export interface TimingGateResult {
  verdict: TimingVerdict;
  durationSec: number;
  outlineSec: number;
  ratio: number; // durationSec / outlineSec
  artifactMd: string; // content of review/timing-gate.md
}

export function runTimingGate(input: TimingGateInput): TimingGateResult {
  const { lessonId, durationSec, outlineMinutes } = input;
  const outlineSec = outlineMinutes * 60;
  const ratio = durationSec / outlineSec;

  let verdict: TimingVerdict;
  if (ratio >= 0.75 && ratio <= 1.2) {
    verdict = 'PASS';
  } else if ((ratio >= 0.6 && ratio < 0.75) || (ratio > 1.2 && ratio <= 1.3)) {
    verdict = 'WARN';
  } else {
    verdict = 'FIX';
  }

  const artifactMd = renderTimingGateMd(lessonId, durationSec, outlineSec, verdict);
  return { verdict, durationSec, outlineSec, ratio, artifactMd };
}

/** Gate artifact body — first line is the machine-readable verdict (gate-status convention). */
export function renderTimingGateMd(
  lessonId: string,
  durationSec: number,
  outlineSec: number,
  verdict: TimingVerdict,
): string {
  const ratio = durationSec / outlineSec;
  const outlineMinutes = outlineSec / 60;

  const actualM = Math.floor(durationSec / 60);
  const actualS = Math.round(durationSec % 60);
  const actualFormatted = `${actualM}m${actualS}s`;

  const ratioPct = (ratio * 100).toFixed(1);

  const outcomeSentences: Record<TimingVerdict, string> = {
    PASS: `Duration is within the 75–120% target window — timing integrity confirmed.`,
    WARN: `Duration is outside the 75–120% pass zone but within the 60–130% warn band — review pacing before publish.`,
    FIX: `Duration falls outside the 60–130% band — lesson length needs significant adjustment.`,
  };

  const lines: string[] = [
    `Verdict: ${verdict}`,
    '',
    `# Gate T — Timing integrity · ${lessonId}`,
    '',
    `- **Actual duration:** ${actualFormatted} (${durationSec}s)`,
    `- **Outline target:** ${outlineMinutes} min (${outlineSec}s)`,
    `- **Ratio:** ${ratioPct}% (pass zone: 75–120%)`,
    '',
    outcomeSentences[verdict],
    '',
  ];
  return lines.join('\n');
}
