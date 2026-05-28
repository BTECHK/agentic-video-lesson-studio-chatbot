import type { LLMProviderInterface } from './types';
import { AnthropicProvider } from './anthropic-provider';
import { MockProvider } from './mock-provider';
import { ClaudeCodeProvider } from './claude-code-provider';
import { loadLLMConfig } from '../config';

export function getLLMProvider(): LLMProviderInterface {
  // Validated, fail-closed config (#57): unknown LLM_PROVIDER values throw here
  // instead of falling through to the paid Anthropic path.
  const { provider } = loadLLMConfig();
  switch (provider) {
    case 'mock':
      return new MockProvider();
    case 'claude-code':
      return new ClaudeCodeProvider();
    case 'anthropic':
      return new AnthropicProvider();
  }
}
