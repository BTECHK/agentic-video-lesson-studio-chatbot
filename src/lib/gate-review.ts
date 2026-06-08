/**
 * Generic Gate A / B review runner (DoD Layers A and B). Same "judge against
 * artifacts" shape as Gate C (gate-lesson.ts) minus the video sensors: assemble
 * the lesson's artifacts + the relevant DoD checklist → Claude Code judges →
 * write review/<artifact>.md with a `Verdict: PASS|FIX` line the gate-status
 * aggregator reads.
 *
 *   Gate A — Fidelity/Provenance/Freshness: verify every tool claim against
 *            official vendor docs (the accuracy-sweep approach).
 *   Gate B — Teaching axis: judge the lesson against its lesson-plan.md.
 *
 * Gate C keeps its own specialized runner (frames + transcript sensors).
 */
import path from 'node:path';
import { extractVerdict, DOD_PATH, type Verdict } from './gate-lesson';
import { GATES } from './gate-status';

export type ReviewGate = 'A' | 'B';

/** Slice one "## Gate X" section out of the DoD (stops at the next gate or `---`). */
export function extractGateSection(dodMd: string, gate: 'A' | 'B' | 'C'): string {
  const start = dodMd.indexOf(`## Gate ${gate}`);
  if (start === -1) return '';
  const rest = dodMd.slice(start);
  const nextGate = rest.search(/\n## Gate [ABC]/);
  const sep = rest.indexOf('\n---');
  const ends = [nextGate, sep].filter((i) => i > 0);
  const end = ends.length ? Math.min(...ends) : -1;
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

export interface ReviewPromptInput {
  gate: ReviewGate;
  gateName: string;
  lessonId: string;
  gateChecklist: string;
  lessonPlanMd: string;
  lessonContextMd: string;
}

export function buildReviewPrompt(i: ReviewPromptInput): string {
  const head = [
    `You are the JUDGE for Sample Academy's Gate ${i.gate} (${i.gateName}) on lesson "${i.lessonId}".`,
    `Sample Academy is a learner-focused AI education platform.`,
    ``,
  ];
  const job =
    i.gate === 'A'
      ? [
          `## Your job — fidelity · provenance · freshness`,
          `Extract every factual claim about an AI tool (features, tiers, pricing, availability,`,
          `launch dates, comparative claims) from the lesson content below, and VERIFY each against`,
          `OFFICIAL vendor documentation — use WebFetch on the official docs, never training data.`,
          `Check fidelity (claims map to outline row ids in the lesson-plan), provenance (each claim`,
          `has a source ref), and freshness (model/price/capability facts are current + dated).`,
        ]
      : [
          `## Your job — does it actually teach?`,
          `Judge the lesson against its own lesson-plan and the Gate B checklist below — not just`,
          `"is it correct" but "does it teach": a clear transformation, a transferable pattern,`,
          `and nothing throwaway.`,
        ];
  const body = [
    ``,
    `## Gate ${i.gate} checklist`,
    i.gateChecklist,
    ``,
    `## The lesson-plan (source of truth)`,
    i.lessonPlanMd,
    ``,
    `## Lesson content under review`,
    i.lessonContextMd,
    ``,
    `## Output`,
    `Write ONLY the markdown body for the review artifact:`,
    `1. First line: "Verdict: PASS" or "Verdict: FIX".`,
    i.gate === 'A'
      ? `2. Each claim as ✓ (verified + source) / ⚠ (needs Instructor) / ✗ (wrong). PASS = zero unresolved ✗.`
      : `2. Each checklist item: pass/fail + a one-line note. PASS = every item passes (or a flagged revision is logged).`,
    `3. If FIX, a short prioritized fix-list.`,
    `No preamble, no code fences.`,
  ];
  return [...head, ...job, ...body].join('\n');
}

export interface ReviewDeps {
  cwd: string;
  exists(p: string): boolean;
  ensureDir(p: string): void;
  readText(p: string): string;
  writeText(p: string, s: string): void;
  judge(prompt: string): Promise<string>;
  log: { info(m: string, d?: unknown): void; warn(m: string, d?: unknown): void; error(m: string, d?: unknown): void };
}

export interface ReviewOptions {
  mode: 'auto' | 'collect';
}

export interface ReviewResult {
  verdict: Verdict | 'pending';
  artifactPath?: string;
}

export async function runReview(lessonId: string, gate: ReviewGate, opts: ReviewOptions, deps: ReviewDeps): Promise<ReviewResult> {
  const def = GATES.find((g) => g.gate === gate);
  if (!def) throw new Error(`Unknown gate ${gate}`);
  const lessonDir = path.join(deps.cwd, 'content', 'lessons', lessonId);
  const reviewDir = path.join(lessonDir, 'review');
  const sensorsDir = path.join(reviewDir, '_sensors');
  const artifactPath = path.join(deps.cwd, 'content', 'lessons', lessonId, def.artifact);
  deps.ensureDir(reviewDir);

  const dodPath = path.join(deps.cwd, DOD_PATH);
  const gateChecklist = deps.exists(dodPath) ? extractGateSection(deps.readText(dodPath), gate) : '';
  const planPath = path.join(lessonDir, 'lesson-plan.md');
  const lessonPlanMd = deps.exists(planPath) ? deps.readText(planPath) : '(no lesson-plan.md found)';

  // Gate A reasons over the factual claims (script + outline); Gate B over the narration vs the plan.
  const read = (rel: string) => {
    const p = path.join(lessonDir, rel);
    return deps.exists(p) ? deps.readText(p) : '';
  };
  const lessonContextMd =
    gate === 'A'
      ? `### script.json\n${read('script.json')}\n\n### outline.json\n${read('outline.json')}`
      : `### script.json (narration)\n${read('script.json')}`;

  const prompt = buildReviewPrompt({ gate, gateName: def.name, lessonId, gateChecklist, lessonPlanMd, lessonContextMd });
  deps.ensureDir(sensorsDir);
  deps.writeText(path.join(sensorsDir, `judge-prompt-${gate}.md`), prompt);

  if (opts.mode !== 'auto') {
    deps.log.info(`Gate ${gate} prompt written; run the judge interactively or re-run with --auto`, { gate });
    return { verdict: 'pending' };
  }

  const md = await deps.judge(prompt);
  deps.writeText(artifactPath, md);
  const verdict = extractVerdict(md);
  deps.log.info(`Gate ${gate} verdict written`, { verdict, artifactPath });
  return { verdict, artifactPath };
}
