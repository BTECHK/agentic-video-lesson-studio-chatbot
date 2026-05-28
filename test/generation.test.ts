import { describe, it, expect, vi } from 'vitest';
import {
  extractResultText,
  parseScriptFromText,
  withRetry,
  selectBackend,
  buildRepairPrompt,
  generateScriptObject,
} from '../src/lib/generation';

const envelope = (result: string) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result });
const scriptEnvelope = (obj: unknown) => envelope(JSON.stringify(obj));

// Captured failure mode from logs/pipeline/generate-2026-05-26.jsonl: claude
// returned prose (a clarifying question) instead of JSON, so parseScriptFromText
// threw "no JSON object found". Pinned here so the repair path stays honest.
const PROSE_FAILURE_ENVELOPE = envelope(
  "I've reviewed the lesson outline and the teaching style guide. Before I generate the script, " +
    "could you confirm whether you'd like the full eight-block structure or the condensed five-block version?",
);

describe('real-failure fixture (generate-2026-05-26)', () => {
  it('reproduces the logged "no JSON object found" failure (model returned prose)', () => {
    const text = extractResultText(PROSE_FAILURE_ENVELOPE);
    expect(() => parseScriptFromText(text)).toThrow(/no JSON object found/);
  });
});

describe('buildRepairPrompt', () => {
  it('demands JSON-only output and echoes the original task', () => {
    const p = buildRepairPrompt('ORIGINAL TASK TEXT', 'sorry, here is some prose');
    expect(p).toMatch(/only.*json/i);
    expect(p).toContain('ORIGINAL TASK TEXT');
  });
});

describe('generateScriptObject (parse + persist + repair)', () => {
  it('returns the parsed object on a clean first response without persisting raw', async () => {
    const persistRaw = vi.fn();
    const runClaude = vi.fn().mockResolvedValue(scriptEnvelope({ blocks: [{ id: 'a' }] }));
    const out = await generateScriptObject('PROMPT', { runClaude, persistRaw });
    expect(out).toEqual({ blocks: [{ id: 'a' }] });
    expect(runClaude).toHaveBeenCalledTimes(1);
    expect(persistRaw).not.toHaveBeenCalled();
  });

  it('persists the raw output and recovers via a repair round when the first parse fails', async () => {
    const persistRaw = vi.fn();
    const runClaude = vi
      .fn()
      .mockResolvedValueOnce(envelope('Sorry, could you clarify the block count first?'))
      .mockResolvedValueOnce(scriptEnvelope({ blocks: [] }));
    const out = await generateScriptObject('PROMPT', { runClaude, persistRaw });
    expect(out).toEqual({ blocks: [] });
    expect(runClaude).toHaveBeenCalledTimes(2);
    expect(persistRaw).toHaveBeenCalledTimes(1); // failed attempt's raw saved for diagnosis
    expect(runClaude.mock.calls[1][0]).toMatch(/only.*json/i); // 2nd call used the repair prompt
  });

  it('persists raw for every failed attempt and throws when the repair also fails', async () => {
    const persistRaw = vi.fn();
    const runClaude = vi.fn().mockResolvedValue(envelope('no json object anywhere in here'));
    await expect(generateScriptObject('PROMPT', { runClaude, persistRaw })).rejects.toThrow(
      /after 2 attempts/i,
    );
    expect(persistRaw).toHaveBeenCalledTimes(2);
  });
});

describe('extractResultText', () => {
  it('pulls the result string from claude --output-format json stdout', () => {
    const stdout = JSON.stringify({ type: 'result', subtype: 'success', result: '{"blocks":[]}' });
    expect(extractResultText(stdout)).toBe('{"blocks":[]}');
  });

  it('throws on an error result', () => {
    const stdout = JSON.stringify({ type: 'result', subtype: 'error_max_turns', result: '' });
    expect(() => extractResultText(stdout)).toThrow();
  });

  it('throws on non-JSON stdout', () => {
    expect(() => extractResultText('not json')).toThrow();
  });
});

describe('parseScriptFromText', () => {
  it('parses a bare JSON object', () => {
    expect(parseScriptFromText('{"blocks":[{"id":"a"}]}')).toEqual({ blocks: [{ id: 'a' }] });
  });

  it('strips ```json fences and surrounding prose', () => {
    const text = 'Here is the script:\n```json\n{"blocks":[]}\n```\nDone.';
    expect(parseScriptFromText(text)).toEqual({ blocks: [] });
  });

  it('throws when no JSON object is present', () => {
    expect(() => parseScriptFromText('no json here')).toThrow();
  });
});

describe('withRetry', () => {
  it('returns on first success without sleeping', async () => {
    const sleep = vi.fn();
    const fn = vi.fn().mockResolvedValue('ok');
    const out = await withRetry(fn, { retries: 3, baseDelayMs: 10, sleep });
    expect(out).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries on failure with exponential backoff then succeeds', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');
    const out = await withRetry(fn, { retries: 3, baseDelayMs: 10, sleep });
    expect(out).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 10);
    expect(sleep).toHaveBeenNthCalledWith(2, 20);
  });

  it('throws the last error after exhausting retries', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockRejectedValue(new Error('always'));
    await expect(withRetry(fn, { retries: 2, baseDelayMs: 1, sleep })).rejects.toThrow('always');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});

describe('selectBackend', () => {
  it('defaults to claude-code', () => {
    expect(selectBackend({})).toBe('claude-code');
  });
  it('honors GENERATION_BACKEND=anthropic-api', () => {
    expect(selectBackend({ GENERATION_BACKEND: 'anthropic-api' })).toBe('anthropic-api');
  });
  it('falls back to claude-code for an unknown value', () => {
    expect(selectBackend({ GENERATION_BACKEND: 'bogus' })).toBe('claude-code');
  });
});
