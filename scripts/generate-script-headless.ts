/**
 * Headless script generation (Studio Generate backend).
 *
 *   tsx scripts/generate-script-headless.ts <lessonId>
 *
 * Builds the script prompt from the lesson's outline + grounding, runs the
 * GenerationProvider (default: a headless `claude -p` — no API key), validates
 * the output against ScriptSchema, runs the fact-check/grounding gate, and writes
 * a DRAFT (script.draft.json) + fact-check report (script.factcheck.json). It does
 * NOT touch the committed script.json — that happens on Apply downstream.
 *
 * The provider call is wrapped with retry + exponential backoff + structured
 * logging so a failed/empty generation is diagnosable, never silent.
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OutlineSchema } from '../content/schemas/outline';
import { ScriptSchema } from '../content/schemas/script';
import { buildGroundingContext } from '../src/lib/grounding';
import { buildScriptPrompt } from '../src/lib/script-prompt';
import { factCheckScript } from '../src/lib/fact-check';
import { runMain, type Logger } from '../src/lib/logger';
import { selectBackend, withRetry, generateScriptObject } from '../src/lib/generation';

/** Spawn a one-shot headless Claude run, feeding the prompt on stdin. */
function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // shell:true so Windows resolves the `claude.cmd` shim (spawn ENOENT otherwise).
    // The prompt is fed on stdin, not as an arg, so there are no quoting concerns.
    const child = spawn('claude', ['-p', '--output-format', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`)),
    );
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

async function generateViaClaudeCode(prompt: string, dir: string, log: Logger): Promise<unknown> {
  // withRetry handles transient CLI failures (non-zero exit); generateScriptObject
  // handles unparseable output — persisting raw and retrying with a repair prompt.
  return generateScriptObject(prompt, {
    runClaude: (p) =>
      withRetry(() => runClaude(p), {
        retries: 2,
        baseDelayMs: 2000,
        onRetry: (attempt, err) => log.warn('claude generation retry', { attempt, err }),
      }),
    persistRaw: (label, raw) => {
      const failDir = join(dir, '.generate-failures');
      mkdirSync(failDir, { recursive: true });
      const file = join(failDir, `${Date.now()}-${label}.txt`);
      writeFileSync(file, raw);
      log.warn('persisted raw model output for diagnosis', { file });
    },
    log,
  });
}

async function main(log: Logger): Promise<number> {
  const lessonId = process.argv[2];
  if (!lessonId) {
    log.error('usage: tsx scripts/generate-script-headless.ts <lessonId>');
    return 2;
  }

  const root = join(import.meta.dirname!, '..');
  const dir = join(root, 'content', 'lessons', lessonId);
  const outlinePath = join(dir, 'outline.json');
  if (!existsSync(outlinePath)) {
    log.error('no outline found', { lessonId, outlinePath });
    return 1;
  }

  const outline = OutlineSchema.parse(JSON.parse(readFileSync(outlinePath, 'utf-8')));
  const grounding = buildGroundingContext(outline);
  const styleGuide = readFileSync(join(root, 'content', 'teaching', 'STYLE.md'), 'utf-8');
  const prompt = buildScriptPrompt(outline, styleGuide, grounding);

  const backend = selectBackend(process.env);
  log.info('generating script', { lessonId, backend });

  let scriptObj: unknown;
  if (backend === 'claude-code') {
    scriptObj = await generateViaClaudeCode(prompt, dir, log);
  } else {
    log.error('anthropic-api backend not implemented in this build — set GENERATION_BACKEND=claude-code', { backend });
    return 1;
  }

  const parsed = ScriptSchema.safeParse(scriptObj);
  if (!parsed.success) {
    log.error('generated script failed ScriptSchema validation', {
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 10),
    });
    return 1;
  }

  const result = factCheckScript(parsed.data, grounding);
  const draftPath = join(dir, 'script.draft.json');
  const reportPath = join(dir, 'script.factcheck.json');
  writeFileSync(draftPath, `${JSON.stringify(parsed.data, null, 2)}\n`);
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);

  log.info('script draft written', {
    lessonId,
    draftPath,
    blocks: parsed.data.blocks.length,
    verifiedRefs: result.verifiedRefs,
    flags: result.flags.length,
    factCheckOk: result.ok,
  });
  for (const f of result.flags) log.warn('fact-check flag', { blockId: f.blockId, ref: f.ref, reason: f.reason });

  // Draft produced successfully; fact-check flags are reported (they block Apply downstream).
  return 0;
}

runMain('generate', main);
