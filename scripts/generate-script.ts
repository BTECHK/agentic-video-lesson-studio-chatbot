import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { buildGroundingContext } from '../src/lib/grounding';
import { buildScriptPrompt } from '../src/lib/script-prompt';
import { factCheckScript } from '../src/lib/fact-check';
import { runMain, type Logger } from '../src/lib/logger';

/**
 * Script generation CLI (SCRIPT-01 / SCRIPT-02).
 *
 *   tsx scripts/generate-script.ts <lessonId>            # write the generation prompt for Claude
 *   tsx scripts/generate-script.ts <lessonId> --check    # validate + fact-check an existing script.json
 *
 * Following the project's Claude Code passthrough design (D-02 / ingest:llm), the prompt is written
 * to disk for Claude to fill — no paid API call. The --check pass validates the produced script.json
 * against the schema and the grounding fact-check gate before it can flow downstream.
 */

function main(log: Logger): number {
  const root = join(import.meta.dirname!, '..');
  const lessonId = process.argv[2];
  const checkMode = process.argv.includes('--check');

  if (!lessonId) {
    log.error('usage: tsx scripts/generate-script.ts <lessonId> [--check]');
    return 1;
  }

  const lessonDir = join(root, 'content', 'lessons', lessonId);
  const outlinePath = join(lessonDir, 'outline.json');
  const scriptPath = join(lessonDir, 'script.json');
  const promptPath = join(lessonDir, '.script-prompt.txt');

  if (!existsSync(outlinePath)) {
    log.error('no outline found', { lessonId, outlinePath });
    return 1;
  }

  const outline = OutlineSchema.parse(JSON.parse(readFileSync(outlinePath, 'utf-8')));
  const grounding = buildGroundingContext(outline);

  if (!checkMode) {
    const styleGuide = readFileSync(join(root, 'content', 'teaching', 'STYLE.md'), 'utf-8');
    const prompt = buildScriptPrompt(outline, styleGuide, grounding);
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(promptPath, prompt, 'utf-8');
    log.info('script prompt written', {
      lessonId,
      promptPath,
      tools: Object.keys(grounding.tools).length,
      capabilities: Object.keys(grounding.capabilities).length,
    });
    log.info(`have Claude produce ${scriptPath} (ScriptSchema JSON), then run with --check`);
    return 0;
  }

  // --- check mode ---
  if (!existsSync(scriptPath)) {
    log.error('no script found — generate it first (run without --check)', { lessonId, scriptPath });
    return 1;
  }

  const parsed = ScriptSchema.safeParse(JSON.parse(readFileSync(scriptPath, 'utf-8')));
  if (!parsed.success) {
    log.error('script.json failed schema validation', {
      lessonId,
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return 1;
  }

  const result = factCheckScript(parsed.data, grounding);
  log.info('fact-check complete', { blocks: parsed.data.blocks.length, verifiedRefs: result.verifiedRefs });
  for (const n of result.notes) log.warn('fact-check note', { blockId: n.blockId, note: n.note });
  for (const f of result.flags) log.error('fact-check flag', { blockId: f.blockId, ref: f.ref, reason: f.reason });

  if (!result.ok) {
    log.error('fact-check FAILED — pipeline blocked', { unverifiable: result.flags.length });
    return 1;
  }
  log.info('script valid and fully grounded', { lessonId });
  return 0;
}

runMain('script', main);
