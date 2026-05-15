import { describe, it, expect, vi, afterEach } from 'vitest';
import { MockProvider } from '@/lib/llm/mock-provider';
import { getLLMProvider } from '@/lib/llm/provider';

describe('MockProvider', () => {
  it('returns a response echoing the user message', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: 'What is Claude?' }],
      accessMode: 'demo',
    });
    expect(response.content).toContain('What is Claude?');
    expect(response.content).toContain('mock response');
  });

  it('includes citations in mock responses', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: 'test' }],
      accessMode: 'student',
    });
    expect(response.citations).toHaveLength(1);
    expect(response.citations[0].module).toBe('Module 1');
    expect(response.citations[0].tool).toBe('MockTool');
  });

  it('handles empty message list', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [],
      accessMode: 'demo',
    });
    expect(response.content).toBeDefined();
  });

  it('uses the last user message for echo', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second question' },
      ],
      accessMode: 'demo',
    });
    expect(response.content).toContain('second question');
  });

  it('returns content-grounded response when contentContext is provided', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: 'Tell me about ChatGPT' }],
      accessMode: 'student',
      contentContext: '### ChatGPT (OpenAI)\nAn AI chatbot.',
    });
    expect(response.content).toContain('grounded in the Sample Academy content repository');
    expect(response.citations[0].tool).toBe('ChatGPT');
  });

  it('falls back to default mock response when contentContext is empty', async () => {
    const provider = new MockProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: 'Hello' }],
      accessMode: 'demo',
      contentContext: '',
    });
    expect(response.content).toContain('mock response');
    expect(response.citations[0].tool).toBe('MockTool');
  });
});

describe('getLLMProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns MockProvider when LLM_PROVIDER=mock', () => {
    vi.stubEnv('LLM_PROVIDER', 'mock');
    const provider = getLLMProvider();
    expect(provider).toBeInstanceOf(MockProvider);
  });

  it('defaults to AnthropicProvider', () => {
    vi.stubEnv('LLM_PROVIDER', 'anthropic');
    const provider = getLLMProvider();
    expect(provider.constructor.name).toBe('AnthropicProvider');
  });
});
