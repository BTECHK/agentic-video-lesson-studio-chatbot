import { describe, it, expect } from 'vitest';
import { loadLLMConfig } from '@/lib/config';

// Server-only config validation (#57, audit P1.6/P1.12). The contract: unknown
// LLM_PROVIDER values fail closed instead of silently using the paid Anthropic
// path, and a chosen paid provider with no key also fails closed.
describe('loadLLMConfig', () => {
  it('defaults to the free mock provider when LLM_PROVIDER is unset', () => {
    expect(loadLLMConfig({})).toEqual({ provider: 'mock' });
  });

  it('accepts mock without requiring an API key', () => {
    expect(loadLLMConfig({ LLM_PROVIDER: 'mock' })).toEqual({ provider: 'mock' });
  });

  it('accepts the free claude-code provider without requiring an API key', () => {
    expect(loadLLMConfig({ LLM_PROVIDER: 'claude-code' })).toEqual({ provider: 'claude-code' });
  });

  it('accepts anthropic when ANTHROPIC_API_KEY is present', () => {
    expect(
      loadLLMConfig({ LLM_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'sk-test' }),
    ).toEqual({ provider: 'anthropic' });
  });

  it('fails closed on an unknown provider value (e.g. the stale claude-passthrough default)', () => {
    expect(() => loadLLMConfig({ LLM_PROVIDER: 'claude-passthrough' })).toThrow(
      /Invalid LLM_PROVIDER/,
    );
  });

  it('fails closed when LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing', () => {
    expect(() => loadLLMConfig({ LLM_PROVIDER: 'anthropic' })).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });
});
