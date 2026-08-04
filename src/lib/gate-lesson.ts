/**
 * Gate C (watch gate) — pure logic. The script `scripts/gate-lesson.ts` wires the
 * real fs / child_process; this module holds the testable pieces.
 *
 * Architecture (locked, see .planning/ROADMAP.md + the dual-path proof):
 *   - Sensors are deterministic and DUMB: frames (watch.py, no key — Claude reads
 *     them) + an OPTIONAL audio transcript (gemini-watch.py, a free-tier SENSOR).
 *   - The JUDGE is always Claude Code, never a sensor model and never a raw API.
 *     `--auto` drives headless `claude -p` (no API key, host's logged-in session);
 *     default `collect` mode leaves the verdict to an interactive/session judge.
 *   - The gate ENDS at writing review/watch-gate.md. Publishing stays human
 *     (Phase 4 enforces the three gates on the publish action).
 */
import path from 'node:path';

export const WATCH_PY = path.join('.claude', 'skills', 'watch', 'scripts', 'watch.py');
export const GEMINI_WATCH_PY = path.join('scripts', 'gemini-watch.py');
export const DOD_PATH = path.join('.planning', 'curriculum', 'LESSON-DEFINITION-OF-DONE.md');

export interface GatePaths {
  mp4: string;
  lessonDir: string;
  reviewDir: string;
  sensorsDir: string;
  framesDir: string;
  framesReport: string;
  transcriptReport: string;
  judgePrompt: string;
  verdict: string;
  lessonPlan: string;
  assumptions: string;
  dod: string;
}

export function gatePaths(lessonId: string, cwd: string = process.cwd()): GatePaths {
  const lessonDir = path.join(cwd, 'content', 'lessons', lessonId);
  const reviewDir = path.join(lessonDir, 'review');
  const sensorsDir = path.join(reviewDir, '_sensors');
  return {
    // Honors RENDER_OUT_DIR like render-lesson.ts (renders live in out/v3)
    mp4: path.join(cwd, process.env.RENDER_OUT_DIR ?? 'out', `${lessonId}.mp4`),
    lessonDir,
    reviewDir,
    sensorsDir,
    framesDir: path.join(sensorsDir, 'frames'),
    framesReport: path.join(sensorsDir, 'frames.md'),
    transcriptReport: path.join(sensorsDir, 'transcript.md'),
    judgePrompt: path.join(sensorsDir, 'judge-prompt.md'),
    verdict: path.join(reviewDir, 'watch-gate.md'),
    lessonPlan: path.join(lessonDir, 'lesson-plan.md'),
    assumptions: path.join(lessonDir, 'assumptions.md'),
    dod: path.join(cwd, DOD_PATH),
  };
}

/** Slice the "## Gate C" section out of the Definition of Done (ends at the next `---`). */
export function extractGateC(dodMd: string): string {
  const start = dodMd.indexOf('## Gate C');
  if (start === -1) return '';
  const rest = dodMd.slice(start);
  const sep = rest.indexOf('\n---');
  return (sep === -1 ? rest : rest.slice(0, sep)).trim();
}

export type Verdict = 'PASS' | 'FIX' | 'UNKNOWN';

/** Read PASS / FIX from a verdict line, case-insensitively. */
export function extractVerdict(md: string): Verdict {
  const m = md.match(/verdict\s*[:-]?\s*(PASS|FIX)/i);
  return m ? (m[1].toUpperCase() as 'PASS' | 'FIX') : 'UNKNOWN';
}

/** argv for the frames sensor: watch.py, frames-only, legible resolution, into framesDir. */
export function framesSensorArgv(mp4: string, framesDir: string, resolution = 1024, maxFrames = 80): string[] {
  return [WATCH_PY, mp4, '--no-whisper', '--resolution', String(resolution), '--max-frames', String(maxFrames), '--out-dir', framesDir];
}

/** argv for the transcript sensor: gemini-watch.py with the chosen provider. */
export function transcriptSensorArgv(mp4: string, provider = 'gemini-voice'): string[] {
  return [GEMINI_WATCH_PY, mp4, '--provider', provider];
}

export interface JudgePromptInput {
  lessonId: string;
  gateCChecklist: string;
  lessonPlanMd: string;
  framesReportMd: string;
  transcriptReportMd?: string;
}

export function buildJudgePrompt(i: JudgePromptInput): string {
  const lines = [
    `You are the JUDGE for Sample Academy's Gate C (watch gate) on lesson "${i.lessonId}".`,
    `Sample Academy is a learner-focused AI education platform. Brand: Syne font, warm linen`,
    `#EDE8E3, crimson #8B2635, 4px radius, smooth spring motion (no choppy slide transitions).`,
    ``,
    `## Your job`,
    `Decide whether the RENDERED video actually works and teaches — by looking at it.`,
    `The frame report lists PNG frame paths; **Read each frame path** to see the video.`,
    i.transcriptReportMd
      ? `An audio transcript from a SENSOR model (Gemini) is included. Treat it as ADVISORY ONLY: ` +
        `Gemini is a sensor, not the judge — verify anything it claims against the frames and the ` +
        `lesson-plan yourself (it has been wrong before, e.g. tool-capability calls).`
      : `No audio transcript is available — this is a frames-only pass. Judge the visual checks; ` +
        `mark the audio/narration checks "not assessed".`,
    ``,
    `## Gate C checklist (check every box against the actual frames)`,
    i.gateCChecklist,
    ``,
    `## The lesson-plan (the journey this video must deliver — source of truth)`,
    i.lessonPlanMd,
    ``,
    `## Frame report — Read each frame path listed here`,
    i.framesReportMd,
  ];
  if (i.transcriptReportMd) {
    lines.push(``, `## Sensor transcript (ADVISORY — verify, don't trust)`, i.transcriptReportMd);
  }
  lines.push(
    ``,
    `## Output`,
    `Write ONLY the markdown body for content/lessons/${i.lessonId}/review/watch-gate.md:`,
    `1. First line: "Verdict: PASS" or "Verdict: FIX".`,
    `2. The frame timestamps you inspected.`,
    `3. Each defect as a bullet: t=MM:SS — what's wrong — which checklist item it fails.`,
    `4. If FIX, a short prioritized fix-list.`,
    `No preamble, no code fences.`,
  );
  return lines.join('\n');
}

// --- orchestration -------------------------------------------------------------

export interface GateDeps {
  cwd: string;
  exists(p: string): boolean;
  ensureDir(p: string): void;
  runPython(argv: string[]): Promise<string>;
  judge(prompt: string): Promise<string>;
  readText(p: string): string;
  writeText(p: string, s: string): void;
  log: { info(m: string, d?: unknown): void; warn(m: string, d?: unknown): void; error(m: string, d?: unknown): void };
}

export interface GateOptions {
  mode: 'auto' | 'collect';
  provider: string;
  transcript: boolean;
  resolution: number;
}

export interface GateResult {
  verdict: Verdict | 'pending';
  verdictPath?: string;
  framesReport: string;
  transcriptReport?: string;
}

export async function runGate(lessonId: string, opts: GateOptions, deps: GateDeps): Promise<GateResult> {
  const p = gatePaths(lessonId, deps.cwd);
  if (!deps.exists(p.mp4)) {
    throw new Error(`No rendered mp4 at ${p.mp4} — render the lesson before running the watch gate.`);
  }
  deps.ensureDir(p.framesDir);
  deps.ensureDir(p.reviewDir);

  // Sensor 1: frames (always — deterministic, no key).
  const framesReportMd = await deps.runPython(framesSensorArgv(p.mp4, p.framesDir, opts.resolution));
  deps.writeText(p.framesReport, framesReportMd);

  // Sensor 2: audio transcript (optional — a free-tier sensor; skip on failure).
  let transcriptReportMd: string | undefined;
  if (opts.transcript) {
    try {
      transcriptReportMd = await deps.runPython(transcriptSensorArgv(p.mp4, opts.provider));
      deps.writeText(p.transcriptReport, transcriptReportMd);
    } catch (e) {
      deps.log.warn('transcript sensor failed — continuing frames-only', { error: String(e) });
    }
  }

  const lessonPlanMd = deps.exists(p.lessonPlan) ? deps.readText(p.lessonPlan) : '(no lesson-plan.md found)';
  const gateCChecklist = deps.exists(p.dod) ? extractGateC(deps.readText(p.dod)) : '';

  const prompt = buildJudgePrompt({ lessonId, gateCChecklist, lessonPlanMd, framesReportMd, transcriptReportMd });
  deps.writeText(p.judgePrompt, prompt);

  if (opts.mode !== 'auto') {
    deps.log.info('sensors collected; judge prompt written', { judgePrompt: p.judgePrompt });
    deps.log.info('Run the judge interactively (read the frames + write watch-gate.md), or re-run with --auto.');
    return { verdict: 'pending', framesReport: p.framesReport, transcriptReport: transcriptReportMd ? p.transcriptReport : undefined };
  }

  // Claude Code is the judge (headless). No API key — the host's logged-in session.
  const verdictMd = await deps.judge(prompt);
  deps.writeText(p.verdict, verdictMd);
  const verdict = extractVerdict(verdictMd);
  deps.log.info('watch-gate verdict written', { verdict, verdictPath: p.verdict });
  return { verdict, verdictPath: p.verdict, framesReport: p.framesReport, transcriptReport: transcriptReportMd ? p.transcriptReport : undefined };
}
