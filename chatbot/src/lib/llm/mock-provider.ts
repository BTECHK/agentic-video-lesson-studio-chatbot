import type { LLMProviderInterface, LLMRequest, LLMResponse } from './types';
import { parseCitations } from '../citations';

export class MockProvider implements LLMProviderInterface {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const lastMessage = request.messages.filter(m => m.role === 'user').pop();
    const userText = lastMessage?.content ?? '';

    let content: string;

    if (request.contentContext && request.contentContext.length > 0) {
      // Content-grounded response: extract first tool name from context
      const toolNameMatch = request.contentContext.match(/^### (\w+)/m);
      const toolName = toolNameMatch ? toolNameMatch[1] : 'ContentTool';
      content = `Hi, I'm Tutor! Based on the course content, here's what I know about "${userText.slice(0, 100)}". ` +
        `This answer is grounded in the Sample Academy content repository. ` +
        `[Source: Module 1, Lesson 1, Tool: ${toolName}]`;
    } else {
      content = `Hi, I'm Tutor! You asked about: "${userText.slice(0, 100)}". ` +
        `This is a mock response for development and testing. ` +
        `[Source: Module 1, Lesson 1, Tool: MockTool]`;
    }

    const { citations } = parseCitations(content);

    return { content, citations };
  }
}
