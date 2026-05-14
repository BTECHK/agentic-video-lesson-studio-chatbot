import Anthropic from '@anthropic-ai/sdk';
import type { LLMProviderInterface, LLMRequest, LLMResponse, LLMMessage } from './types';
import { getSystemPrompt } from './system-prompt';
import { parseCitations } from '../citations';

export class AnthropicProvider implements LLMProviderInterface {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const systemPrompt = getSystemPrompt(request.accessMode);

    const messages = request.messages
      .filter((m): m is LLMMessage & { role: 'user' | 'assistant' } =>
        m.role === 'user' || m.role === 'assistant',
      )
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    if (!response.content.length || response.content[0].type !== 'text') {
      return { content: '', citations: [] };
    }

    const content = response.content[0].text;
    const { citations } = parseCitations(content);

    return { content, citations };
  }
}
