import Anthropic from '@anthropic-ai/sdk';
import type { LLMProviderInterface, LLMRequest, LLMResponse, LLMMessage } from './types';
import { getSystemPrompt } from './system-prompt';

export class ClaudePassthroughProvider implements LLMProviderInterface {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
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

    const content =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      citations: parseCitations(content),
    };
  }
}

function parseCitations(
  content: string,
): LLMResponse['citations'] {
  const citationRegex = /\[Source: ([^\]]+)\]/g;
  const citations: LLMResponse['citations'] = [];
  let match;
  let index = 0;

  while ((match = citationRegex.exec(content)) !== null) {
    const raw = match[1];
    const moduleMatch = raw.match(/Module\s+(\d+)/i);
    const lessonMatch = raw.match(/Lesson\s+(\d+)/i);
    const toolMatch = raw.match(/Tool:\s*(\w+)/i);
    citations.push({
      id: `cite-${index++}`,
      module: moduleMatch ? `Module ${moduleMatch[1]}` : 'General',
      lesson: lessonMatch ? `Lesson ${lessonMatch[1]}` : 'General',
      tool: toolMatch ? toolMatch[1] : undefined,
      snippet: raw,
    });
  }

  return citations;
}
