import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleProvider, extractGoogleText } from '@/lib/llm/google-provider';
import { resetGoogleChatbotUsageState } from '@/lib/llm/google-usage';

describe('extractGoogleText', () => {
  it('joins text parts from the first candidate', () => {
    expect(
      extractGoogleText({
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello' }, { text: 'world' }],
            },
          },
        ],
      }),
    ).toBe('Hello\nworld');
  });

  it('returns empty string when no text is present', () => {
    expect(extractGoogleText({ candidates: [] })).toBe('');
  });
});

describe('GoogleProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetGoogleChatbotUsageState();
  });

  it('returns parsed content and citations when Google responds with text', async () => {
    vi.stubEnv('GOOGLE_CHATBOT_API_KEY', 'gk-test');
    vi.stubEnv('GOOGLE_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('GOOGLE_CHATBOT_DAILY_LIMIT', '5');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Tutor answer [Source: Module 1, Lesson 1, Tool: ChatGPT]' }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new GoogleProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: 'hello' }],
      accessMode: 'demo',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.['x-goog-api-key']).toBe('gk-test');
    expect(response.content).toContain('Tutor answer');
    expect(response.citations).toHaveLength(1);
  });

  it('throws an error with status for non-2xx responses', async () => {
    vi.stubEnv('GOOGLE_CHATBOT_API_KEY', 'gk-test');
    vi.stubEnv('GOOGLE_CHATBOT_DAILY_LIMIT', '5');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => '{"error":"rate_limited"}',
      }),
    );

    const provider = new GoogleProvider();
    await expect(
      provider.chat({
        messages: [{ role: 'user', content: 'hello' }],
        accessMode: 'demo',
      }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it('throws a 502 when the API returns no text candidate', async () => {
    vi.stubEnv('GOOGLE_CHATBOT_API_KEY', 'gk-test');
    vi.stubEnv('GOOGLE_CHATBOT_DAILY_LIMIT', '5');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          promptFeedback: { blockReason: 'SAFETY' },
        }),
      }),
    );

    const provider = new GoogleProvider();
    await expect(
      provider.chat({
        messages: [{ role: 'user', content: 'hello' }],
        accessMode: 'demo',
      }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('enforces the local daily safety cap before sending another request', async () => {
    vi.stubEnv('GOOGLE_CHATBOT_API_KEY', 'gk-test');
    vi.stubEnv('GOOGLE_CHATBOT_DAILY_LIMIT', '1');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'ok [Source: Module 1, Lesson 1, Tool: ChatGPT]' }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new GoogleProvider();
    await provider.chat({
      messages: [{ role: 'user', content: 'first' }],
      accessMode: 'demo',
    });
    await expect(
      provider.chat({
        messages: [{ role: 'user', content: 'second' }],
        accessMode: 'demo',
      }),
    ).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
