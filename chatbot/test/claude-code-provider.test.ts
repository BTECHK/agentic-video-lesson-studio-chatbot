import { describe, it, expect } from 'vitest';
import {
  ClaudeCodeProvider,
  extractClaudeResult,
  buildChatPrompt,
} from '@/lib/llm/claude-code-provider';

// #63: free Tutor chat via headless `claude -p --output-format json` (no API key).
// The CLI boundary is injected so these tests exercise real provider logic without
// spawning claude.

const envelope = (result: string) =>
  JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result });

describe('extractClaudeResult', () => {
  it('returns the result text from a successful claude -p json envelope', () => {
    expect(extractClaudeResult(envelope('Hello from Tutor'))).toBe('Hello from Tutor');
  });

  it('throws when stdout is not valid JSON', () => {
    expect(() => extractClaudeResult('not json at all')).toThrow(/not valid JSON/);
  });

  it('throws when the envelope reports an error', () => {
    expect(() =>
      extractClaudeResult(JSON.stringify({ is_error: true, subtype: 'error_during_execution' })),
    ).toThrow(/error result/);
  });

  it('throws when the result text is empty', () => {
    expect(() => extractClaudeResult(envelope(''))).toThrow(/empty/);
  });
});

describe('buildChatPrompt', () => {
  it('includes the system prompt and the latest student message', () => {
    const prompt = buildChatPrompt(
      [{ role: 'user', content: 'What is Claude?' }],
      'SYSTEM-PROMPT-MARKER',
    );
    expect(prompt).toContain('SYSTEM-PROMPT-MARKER');
    expect(prompt).toContain('What is Claude?');
  });

  it('renders prior turns as a transcript', () => {
    const prompt = buildChatPrompt(
      [
        { role: 'user', content: 'first question' },
        { role: 'assistant', content: 'first answer' },
        { role: 'user', content: 'second question' },
      ],
      'sys',
    );
    expect(prompt).toContain('first question');
    expect(prompt).toContain('first answer');
    expect(prompt).toContain('second question');
  });
});

describe('ClaudeCodeProvider', () => {
  it('returns the assistant text and parsed citations from the CLI envelope', async () => {
    const provider = new ClaudeCodeProvider(async () =>
      envelope('ChatGPT is an AI chatbot. [Source: Module 1, Lesson 1, Tool: ChatGPT]'),
    );
    const res = await provider.chat({
      messages: [{ role: 'user', content: 'Tell me about ChatGPT' }],
      accessMode: 'student',
      contentContext: '### ChatGPT (OpenAI)\nAn AI chatbot.',
    });
    expect(res.content).toContain('ChatGPT is an AI chatbot');
    expect(res.citations.length).toBeGreaterThanOrEqual(1);
    expect(res.citations[0].tool).toBe('ChatGPT');
  });

  it('feeds the grounded system prompt (with the untrusted-content guard) to the CLI', async () => {
    let captured = '';
    const provider = new ClaudeCodeProvider(async (prompt) => {
      captured = prompt;
      return envelope('ok');
    });
    await provider.chat({
      messages: [{ role: 'user', content: 'hi' }],
      accessMode: 'student',
      contentContext: '### ChatGPT\nsome data',
    });
    expect(captured).toContain('Tutor'); // persona reaches the model
    expect(captured).toContain('UNTRUSTED DATA'); // grounding guard reaches the model
  });

  it('propagates a CLI failure so the chat route can map it to an HTTP error', async () => {
    const provider = new ClaudeCodeProvider(async () => {
      throw new Error('claude exited 1');
    });
    await expect(
      provider.chat({ messages: [{ role: 'user', content: 'hi' }], accessMode: 'demo' }),
    ).rejects.toThrow(/claude exited 1/);
  });
});
