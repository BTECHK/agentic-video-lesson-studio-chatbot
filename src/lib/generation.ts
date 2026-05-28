/**
 * Generation backend helpers for website-driven content creation (Studio Generate).
 * Pure/seam logic only — parsing a headless `claude -p --output-format json` response,
 * a retry+backoff wrapper, and backend selection. The orchestration (spawning claude,
 * fs, fact-check) lives in scripts/generate-script-headless.ts.
 */

export type GenerationBackend = 'claude-code' | 'anthropic-api';

/** Pick the generation backend from env; default claude-code (no API key, dev). */
export function selectBackend(env: NodeJS.ProcessEnv | Record<string, string | undefined>): GenerationBackend {
  return env.GENERATION_BACKEND === 'anthropic-api' ? 'anthropic-api' : 'claude-code';
}

interface ClaudeResult {
  type?: string;
  subtype?: string;
  result?: string;
  is_error?: boolean;
}

/** Extract the assistant's result text from `claude -p --output-format json` stdout. */
export function extractResultText(stdout: string): string {
  let parsed: ClaudeResult;
  try {
    parsed = JSON.parse(stdout) as ClaudeResult;
  } catch {
    throw new Error('claude output was not valid JSON');
  }
  if (parsed.is_error || (parsed.subtype && parsed.subtype !== 'success')) {
    throw new Error(`claude returned an error result: ${parsed.subtype ?? 'unknown'}`);
  }
  if (typeof parsed.result !== 'string' || parsed.result.length === 0) {
    throw new Error('claude result was empty');
  }
  return parsed.result;
}

/** Parse a script object out of model text — tolerates ```json fences and surrounding prose. */
export function parseScriptFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  // Fall back to the first {...} span if there's leading/trailing prose.
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no JSON object found in model output');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (attempt: number, err: unknown) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Run fn with exponential backoff: delays baseDelay, 2x, 4x… between attempts. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const sleep = opts.sleep ?? defaultSleep;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.retries) break;
      opts.onRetry?.(attempt + 1, err);
      await sleep(opts.baseDelayMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

/**
 * Build a repair prompt after an unparseable generation. The model sometimes
 * returns prose (e.g. a clarifying question) instead of JSON — the exact failure
 * logged on 2026-05-26. This re-states the task and demands JSON-only output.
 */
export function buildRepairPrompt(originalPrompt: string, malformed: string): string {
  return [
    'Your previous response could not be parsed as JSON.',
    'Return ONLY a single valid JSON object matching the requested schema —',
    'no prose, no questions, no explanation, no markdown code fences.',
    '',
    '## Original task',
    originalPrompt,
    '',
    '## Your previous (unparseable) response, for reference',
    malformed.slice(0, 2000),
  ].join('\n');
}

export interface ScriptGenDeps {
  /** Runs one headless claude invocation for the given prompt, returns raw stdout. */
  runClaude: (prompt: string) => Promise<string>;
  /** Persists raw stdout from a failed attempt so the failure is diagnosable. */
  persistRaw: (label: string, raw: string) => void;
  /** Max attempts incl. the initial one (default 2: one generate + one repair). */
  maxAttempts?: number;
  log?: { warn: (msg: string, meta?: Record<string, unknown>) => void };
}

/**
 * Generate + parse a script object, hardened against the brittle-parse failure:
 * on any failed parse it persists the raw output (P0.4 — never lose the evidence)
 * and retries once with a JSON-only repair prompt. Throws only after every attempt
 * fails, so generation can never "succeed" on unparseable output.
 */
export async function generateScriptObject(prompt: string, deps: ScriptGenDeps): Promise<unknown> {
  const maxAttempts = deps.maxAttempts ?? 2;
  let lastErr: unknown;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await deps.runClaude(currentPrompt);
    try {
      return parseScriptFromText(extractResultText(raw));
    } catch (err) {
      lastErr = err;
      deps.persistRaw(`attempt-${attempt}`, raw);
      deps.log?.warn('script parse failed; persisted raw output', {
        attempt,
        err: String(err),
      });
      currentPrompt = buildRepairPrompt(prompt, raw);
    }
  }

  throw new Error(
    `script generation produced no valid JSON after ${maxAttempts} attempts: ${String(lastErr)}`,
  );
}
