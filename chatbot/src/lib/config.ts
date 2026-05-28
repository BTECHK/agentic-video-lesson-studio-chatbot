import { z } from 'zod';

// Server-only config validation (#57, audit P1.6/P1.12).
//
// Canonical LLM provider set:
//   mock        - free, deterministic, no external calls (dev/test/CI default).
//   claude-code - free Tutor chat via the headless `claude -p` CLI (#63), no API key.
//   anthropic   - paid API; requires ANTHROPIC_API_KEY.
//   google      - Gemini API; requires GOOGLE_CHATBOT_API_KEY (or legacy GOOGLE_API_KEY).
// Anything outside this set fails closed instead of silently routing to a paid path.
const ProviderSchema = z.enum(['mock', 'claude-code', 'anthropic', 'google']);
export type LLMProviderName = z.infer<typeof ProviderSchema>;

export interface LLMConfig {
  provider: LLMProviderName;
}

/** Preferred key lane for Tutor chat. Legacy GOOGLE_API_KEY is accepted as fallback. */
export function resolveGoogleChatbotApiKey(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  return env.GOOGLE_CHATBOT_API_KEY ?? env.GOOGLE_API_KEY;
}

/**
 * Parse and validate LLM-related configuration, failing closed on bad input.
 * Defaults to the free `mock` provider when unset so an unconfigured deploy can
 * never accidentally call (and bill) a paid API.
 */
export function loadLLMConfig(
  env: Record<string, string | undefined> = process.env,
): LLMConfig {
  const raw = env.LLM_PROVIDER ?? 'mock';
  const result = ProviderSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid LLM_PROVIDER "${raw}". Valid values: ${ProviderSchema.options.join(', ')}.`,
    );
  }
  const provider = result.data;

  // A chosen paid provider with no key is a misconfiguration - fail closed
  // rather than constructing a client that 401s on the first request.
  if (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) {
    throw new Error(
      'LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY. Set the key or use LLM_PROVIDER=mock.',
    );
  }
  if (provider === 'google' && !resolveGoogleChatbotApiKey(env)) {
    throw new Error(
      'LLM_PROVIDER=google requires GOOGLE_CHATBOT_API_KEY (or GOOGLE_API_KEY). Set the key or use LLM_PROVIDER=mock.',
    );
  }

  return { provider };
}
