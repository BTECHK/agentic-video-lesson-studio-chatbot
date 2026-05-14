import type { LLMProviderInterface } from './types';
import { AnthropicProvider } from './anthropic-provider';
import { MockProvider } from './mock-provider';

export function getLLMProvider(): LLMProviderInterface {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  switch (provider) {
    case 'mock':
      return new MockProvider();
    case 'anthropic':
    default:
      return new AnthropicProvider();
  }
}
