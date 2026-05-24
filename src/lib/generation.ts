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
