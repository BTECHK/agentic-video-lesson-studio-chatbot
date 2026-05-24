import { describe, it, expect, vi } from 'vitest';
import {
  extractResultText,
  parseScriptFromText,
  withRetry,
  selectBackend,
} from '../src/lib/generation';

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
