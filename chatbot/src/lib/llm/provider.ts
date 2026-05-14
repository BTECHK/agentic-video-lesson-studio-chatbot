import type { LLMProviderInterface } from './types';
import { ClaudePassthroughProvider } from './claude-passthrough';
import { ApiKeyProvider } from './api-key';

export function getLLMProvider(): LLMProviderInterface {
  const provider = process.env.LLM_PROVIDER || 'claude-passthrough';
  switch (provider) {
    case 'api-key':
      return new ApiKeyProvider();
    case 'claude-passthrough':
    default:
      return new ClaudePassthroughProvider();
  }
}
