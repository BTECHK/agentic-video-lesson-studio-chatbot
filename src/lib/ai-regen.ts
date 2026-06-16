/**
 * AI regeneration wiring (#18).
 *
 * A clip comment is *direction for the AI*, not a deterministic edit. This module
 * turns that comment into an edit of the committed `script.json`; because the regen
 * DAG hashes `script.json` as an input to `plan`, rewriting it here makes the whole
 * downstream cascade (plan → tts → align → render) pick the change up on the next
 * `regenerate` pass. The live model call is injected (`AiEditDeps.generate`) so the
 * orchestration is unit-testable without spawning Claude.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { generateScriptObject, withRetry } from './generation';

export interface EditPromptInput {
  lessonId: string;
  sceneId?: string;
  comment: string;
  scriptJson: string;
}

/** Build the JSON-only edit prompt that applies a reviewer's comment to the script. */
export function buildEditPrompt(input: EditPromptInput): string {
  const target = input.sceneId ? `scene "${input.sceneId}"` : 'the lesson script';
  return [
    `You are editing the script for lesson "${input.lessonId}".`,
    `Apply this reviewer direction to ${target}:`,
    '',
    input.comment.trim(),
    '',
    'Return ONLY the full updated script as a single JSON object with the same shape as the input',
    '(a top-level "blocks" array of { id, narration, ... }). Change only what the direction requires;',
    'preserve every other block verbatim, including ids and ordering. No prose, no markdown fences.',
    '',
    '## Current script',
    input.scriptJson,
  ].join('\n');
}

interface ScriptBlock {
  id: string;
  narration: string;
}
interface EditedScript {
  blocks: ScriptBlock[];
}

function assertEditedScript(x: unknown): asserts x is EditedScript {
  const blocks = (x as { blocks?: unknown })?.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('AI edit did not return a non-empty "blocks" array');
  }
  for (const b of blocks) {
    if (typeof (b as ScriptBlock)?.id !== 'string' || typeof (b as ScriptBlock)?.narration !== 'string') {
      throw new Error('AI edit returned a block missing a string id/narration');
    }
  }
}

export interface AiEditDeps {
  /** Runs the model on the edit prompt and returns the parsed script object. */
  generate: (prompt: string) => Promise<unknown>;
  /** Project root; script path resolves against it. Defaults to cwd. */
  root?: string;
}

/**
 * Apply a reviewer comment to a lesson's `script.json` via the AI, validate the
 * result, and write it back (preserving non-block top-level fields). Throws — and
 * leaves `script.json` untouched — if the model output is not a valid script.
 */
export async function aiEditScript(
  lessonId: string,
  edit: { sceneId?: string; comment: string },
  deps: AiEditDeps,
): Promise<EditedScript> {
  const root = deps.root ?? process.cwd();
  const scriptPath = join(root, 'content', 'lessons', lessonId, 'script.json');
  const scriptJson = readFileSync(scriptPath, 'utf-8');

  const prompt = buildEditPrompt({ lessonId, sceneId: edit.sceneId, comment: edit.comment, scriptJson });
  const edited = await deps.generate(prompt);
  assertEditedScript(edited); // throws before any write if invalid

  const original = JSON.parse(scriptJson) as Record<string, unknown>;
  const merged = { ...original, blocks: edited.blocks };
  writeFileSync(scriptPath, `${JSON.stringify(merged, null, 2)}\n`);
  return edited;
}

/** Spawn a one-shot headless Claude run, feeding the prompt on stdin. */
function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // shell:true so Windows resolves the `claude.cmd` shim; prompt on stdin = no quoting.
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

/** Default live generator: the claude-code backend, hardened with retry + repair. */
export const claudeAiEditGenerate = (prompt: string): Promise<unknown> =>
  generateScriptObject(prompt, {
    runClaude: (p) => withRetry(() => runClaude(p), { retries: 2, baseDelayMs: 2000 }),
    persistRaw: () => {},
  });
