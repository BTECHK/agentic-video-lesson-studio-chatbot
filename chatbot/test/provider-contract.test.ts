/**
 * Shared provider contract test (#70 P1.14).
 *
 * Every LLMProviderInterface implementation must satisfy these invariants:
 *   1. chat() resolves to { content: string (non-empty), citations: Array }
 *   2. Every citation has the required string fields (id, module, lesson, snippet);
 *      optional fields (tool, verifiedDate), when present, are strings.
 *   3. A content-grounded request (contentContext provided) still satisfies 1 & 2.
 *   4. Calling chat() twice is stable (does not throw, returns the same shape).
 *
 * Each provider is wired to a minimal canned/mocked upstream — no real
 * network or CLI calls are made.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LLMProviderInterface, LLMRequest, LLMResponse } from '@/lib/llm/types';
import { MockProvider } from '@/lib/llm/mock-provider';
import { ClaudeCodeProvider } from '@/lib/llm/claude-code-provider';
import { GoogleProvider } from '@/lib/llm/google-provider';
import { AnthropicProvider } from '@/lib/llm/anthropic-provider';
import { resetGoogleChatbotUsageState } from '@/lib/llm/google-usage';

// ---------------------------------------------------------------------------
// Canned response text — contains one well-formed inline citation so that the
// parseCitations utility can extract it and the citation contract can be tested.
// ---------------------------------------------------------------------------
const CANNED_TEXT =
  'Tutor says: prompt engineering is the art of writing effective instructions. ' +
  '[Source: Module 1, Lesson 1, Tool: ChatGPT]';

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK so AnthropicProvider never hits the network.
// vi.mock factories are hoisted — no module-scope variables can be referenced
// here, so the canned text is inlined directly.
// ---------------------------------------------------------------------------
vi.mock('@anthropic-ai/sdk', () => {
  const cannedText =
    'Tutor says: prompt engineering is the art of writing effective instructions. ' +
    '[Source: Module 1, Lesson 1, Tool: ChatGPT]';
  // Must be a real class so `new Anthropic(...)` in the provider doesn't throw.
  class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: cannedText }],
      }),
    };
  }
  return { default: MockAnthropic };
});

// ---------------------------------------------------------------------------
// Provider factory — each entry returns a fresh, wired provider instance.
// ---------------------------------------------------------------------------
function makeClaudeCodeProvider(): LLMProviderInterface {
  const runner = vi.fn().mockResolvedValue(
    JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: CANNED_TEXT }),
  );
  return new ClaudeCodeProvider(runner);
}

function makeGoogleProvider(): LLMProviderInterface {
  vi.stubEnv('GOOGLE_CHATBOT_API_KEY', 'gk-contract-test');
  vi.stubEnv('GOOGLE_CHATBOT_DAILY_LIMIT', '100');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: CANNED_TEXT }] } }],
    }),
  }));
  return new GoogleProvider();
}

function makeAnthropicProvider(): LLMProviderInterface {
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-contract-test');
  return new AnthropicProvider();
}

// ---------------------------------------------------------------------------
// Base requests
// ---------------------------------------------------------------------------
const BASE_REQUEST: LLMRequest = {
  messages: [{ role: 'user', content: 'What is prompt engineering?' }],
  accessMode: 'student',
};

const GROUNDED_REQUEST: LLMRequest = {
  ...BASE_REQUEST,
  contentContext: '### ChatGPT (OpenAI)\nAn AI assistant by OpenAI.',
};

// ---------------------------------------------------------------------------
// Contract assertion helpers
// ---------------------------------------------------------------------------
function assertResponseShape(res: LLMResponse): void {
  // 1. content is a non-empty string
  expect(typeof res.content).toBe('string');
  expect(res.content.length).toBeGreaterThan(0);

  // 1. citations is an Array
  expect(Array.isArray(res.citations)).toBe(true);
}

function assertCitationShape(res: LLMResponse): void {
  for (const cit of res.citations) {
    // 2. Required string fields
    expect(typeof cit.id).toBe('string');
    expect(cit.id.length).toBeGreaterThan(0);
    expect(typeof cit.module).toBe('string');
    expect(cit.module.length).toBeGreaterThan(0);
    expect(typeof cit.lesson).toBe('string');
    expect(cit.lesson.length).toBeGreaterThan(0);
    expect(typeof cit.snippet).toBe('string');
    expect(cit.snippet.length).toBeGreaterThan(0);

    // 2. Optional fields, when present, must be strings
    if (cit.tool !== undefined) {
      expect(typeof cit.tool).toBe('string');
    }
    if (cit.verifiedDate !== undefined) {
      expect(typeof cit.verifiedDate).toBe('string');
    }
  }
}

// ---------------------------------------------------------------------------
// Parametrized contract suite
// ---------------------------------------------------------------------------
const PROVIDERS: Array<{ name: string; factory: () => LLMProviderInterface }> = [
  { name: 'MockProvider', factory: () => new MockProvider() },
  { name: 'ClaudeCodeProvider', factory: makeClaudeCodeProvider },
  { name: 'GoogleProvider', factory: makeGoogleProvider },
  { name: 'AnthropicProvider', factory: makeAnthropicProvider },
];

describe.each(PROVIDERS)('$name — provider contract', ({ factory }) => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetGoogleChatbotUsageState();
  });

  it('1+2: resolves to { content: string (non-empty), citations: Array } with valid citation shapes', async () => {
    const provider = factory();
    const res = await provider.chat(BASE_REQUEST);
    assertResponseShape(res);
    assertCitationShape(res);
  });

  it('3: content-grounded request (contentContext provided) still satisfies the contract', async () => {
    const provider = factory();
    const res = await provider.chat(GROUNDED_REQUEST);
    assertResponseShape(res);
    assertCitationShape(res);
  });

  it('4: calling chat() twice is stable (does not throw, returns consistent shape)', async () => {
    const provider = factory();
    const [res1, res2] = await Promise.all([
      provider.chat(BASE_REQUEST),
      provider.chat(BASE_REQUEST),
    ]);
    assertResponseShape(res1);
    assertResponseShape(res2);
  });
});
