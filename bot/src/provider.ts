import type { ChatTurn, LLMProvider } from './types.js';

/**
 * Deterministic provider for tests/dev — no key, no network. Echoes a grounded
 * answer shape so the brain pipeline (retrieval → prompt → guard) is testable
 * end-to-end offline. If the system prompt carries tool context, it emits a
 * citation for the first tool named in it.
 */
export class MockProvider implements LLMProvider {
  readonly name = 'mock';
  async complete(system: string, history: ChatTurn[], _max: number): Promise<string> {
    const last = [...history].reverse().find((t) => t.role === 'user')?.content ?? '';
    const toolMatch = system.match(/### ([\w .+-]+) \(/); // first tool header in the context
    if (toolMatch) {
      const tool = toolMatch[1].trim();
      return `Here's the short version on "${last.slice(0, 40)}": ${tool} is a solid pick for that. [Source: Module 1, Lesson 1, Tool: ${tool}]`;
    }
    return `I can help with AI tools and the course. What would you like to know? (re: "${last.slice(0, 40)}")`;
  }
}

/**
 * Gemini provider via the REST API (free tier) — no SDK dependency, just fetch,
 * so the image stays tiny and Cloud-Run-cold-start friendly. The key lives only
 * in the server env (GOOGLE_CHATBOT_API_KEY), never in the prompt or client.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  constructor(
    private apiKey: string,
    private model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  ) {}

  async complete(system: string, history: ChatTurn[], maxOutputTokens: number): Promise<string> {
    const contents = history.map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.content }],
    }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens, temperature: 0.7 },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return text.trim() || "I didn't catch that — try asking about a specific AI tool or lesson.";
  }
}

export function makeProvider(env = process.env): LLMProvider {
  const which = env.LLM_PROVIDER ?? 'mock';
  if (which === 'mock') return new MockProvider();
  if (which === 'gemini') {
    const key = env.GOOGLE_CHATBOT_API_KEY ?? env.GOOGLE_API_KEY;
    if (!key) {
      // Fail closed — never silently fall back to an unconfigured paid path.
      throw new Error('LLM_PROVIDER=gemini requires GOOGLE_CHATBOT_API_KEY. Set it or use mock.');
    }
    return new GeminiProvider(key);
  }
  throw new Error(`Unknown LLM_PROVIDER "${which}". Valid: mock, gemini.`);
}
