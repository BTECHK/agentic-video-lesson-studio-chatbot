import { describe, it, expect } from 'vitest';
import { classifyProviderError } from '@/lib/llm/errors';

describe('classifyProviderError', () => {
  it('maps auth/permission errors (401/403) to a neutral 503', () => {
    expect(classifyProviderError({ status: 401, message: 'invalid x-api-key' }).status).toBe(503);
    expect(classifyProviderError({ status: 403, message: 'forbidden' }).status).toBe(503);
  });

  it('maps a model-not-found (404) to a neutral 503', () => {
    // The deprecated-model failure (#30) shows up here once the model is sunset.
    expect(classifyProviderError({ status: 404, message: 'model not found' }).status).toBe(503);
  });

  it('maps rate limiting (429) to 429 with a retry hint', () => {
    const r = classifyProviderError({ status: 429, message: 'rate limited' });
    expect(r.status).toBe(429);
    expect(r.message.toLowerCase()).toContain('again');
  });

  it('maps credit/billing problems to a neutral 503 without leaking "credit"', () => {
    const r = classifyProviderError({ status: 400, message: 'Your credit balance is too low to access the API' });
    expect(r.status).toBe(503);
    expect(r.message.toLowerCase()).not.toContain('credit');
  });

  it('maps 5xx provider errors to 502', () => {
    expect(classifyProviderError({ status: 500, message: 'overloaded' }).status).toBe(502);
  });

  it('falls back to 500 for unknown/non-status errors', () => {
    expect(classifyProviderError(new Error('boom')).status).toBe(500);
    expect(classifyProviderError('weird').status).toBe(500);
  });
});
