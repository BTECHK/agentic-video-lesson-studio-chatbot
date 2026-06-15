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
    // Gemini 2.5 models spend output tokens on internal "thinking" BEFORE any
    // visible text. Left on with a tight maxOutputTokens, the model routinely
    // burns the whole budget thinking and returns finishReason=MAX_TOKENS with
    // EMPTY text — which used to surface as a canned "I didn't catch that" line
    // and read as a dumb bot. Default it OFF (budget 0) for grounded Q&A; set
    // GEMINI_THINKING_BUDGET to re-enable per-request reasoning if ever needed.
    private thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? 0),
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
        generationConfig: {
          maxOutputTokens,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: this.thinkingBudget },
        },
      }),
    });
    if (!res.ok) {
      // Thrown → caught in brain.respond → graceful reply (never a raw 500).
      throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      promptFeedback?: { blockReason?: string };
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    if (text) return text;

    // No visible text — say WHY in the logs, and return an on-persona line that
    // never looks like an error or leaks internals to the student.
    const reason = data.promptFeedback?.blockReason ?? candidate?.finishReason ?? 'EMPTY';
    console.warn(`[tutor-bot] gemini empty response (reason=${reason}, model=${this.model})`);
    if (reason === 'SAFETY' || data.promptFeedback?.blockReason) {
      return "I can't help with that one — but ask me about any AI tool or a lesson and I'm all yours.";
    }
    if (reason === 'MAX_TOKENS') {
      return "That answer ran long on my end — try asking about one specific tool or step and I'll keep it tight.";
    }
    return "I didn't quite catch that — try asking about a specific AI tool or lesson.";
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
