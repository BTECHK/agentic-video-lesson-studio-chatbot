import type { LLMProviderInterface, LLMRequest, LLMResponse } from './types';
import { parseCitations } from '../citations';

export class MockProvider implements LLMProviderInterface {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const lastMessage = request.messages.filter(m => m.role === 'user').pop();
    const userText = lastMessage?.content ?? '';

    const content = `Hi, I'm Tutor! You asked about: "${userText.slice(0, 100)}". ` +
      `This is a mock response for development and testing. ` +
      `[Source: Module 1, Lesson 1, Tool: MockTool]`;

    const { citations } = parseCitations(content);

    return { content, citations };
  }
}
