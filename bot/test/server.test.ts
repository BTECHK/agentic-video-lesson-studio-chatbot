import { describe, it, expect, afterEach, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { startServer } from '../src/server.js';
import { MockProvider } from '../src/provider.js';
import { RateLimiter, GlobalDailyCap } from '../src/rate-limit.js';
import { TelegramChannel } from '../src/channels/telegram.js';
import type { LLMProvider, ToolData } from '../src/types.js';

const TOOLS: ToolData[] = [
  {
    id: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    description: 'Assistant for research and writing.',
    url: 'https://claude.ai',
    capabilities: { research: { supported: true, summary: 'research' } },
  },
];

class ThrowingProvider implements LLMProvider {
  readonly name = 'throwing';
  async complete(): Promise<string> {
    throw new Error('Gemini 429: quota exceeded');
  }
}

let server: Server;
afterEach(() => server?.close());

function boot(deps: Partial<Parameters<typeof startServer>[0]> = {}) {
  server = startServer(
    { provider: new MockProvider(), tools: TOOLS, ...deps } as Parameters<typeof startServer>[0],
    0,
  );
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

const post = (base: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

describe('server /chat', () => {
  it('returns a graceful 200 reply (never the bare word "internal") when the provider throws', async () => {
    const base = boot({ provider: new ThrowingProvider() });
    const r = await post(base, { message: 'who are you?', sessionId: 's1' });
    expect(r.status).toBe(200);
    const data = (await r.json()) as { text: string; error?: string };
    expect(data.error).toBeUndefined();
    expect(data.text.toLowerCase()).not.toBe('internal');
    expect(data.text).toContain('hiccup');
  });

  it('renders a clean Sources footer (no raw [Source:] markup)', async () => {
    const base = boot();
    const r = await post(base, { message: 'tell me about Claude', sessionId: 's2' });
    const data = (await r.json()) as { display: string };
    expect(data.display).toContain('Sources: Claude');
    expect(data.display).not.toContain('[Source:');
  });

  it('rate-limits by client IP, not the client-supplied sessionId', async () => {
    const base = boot({ webLimiter: new RateLimiter(1) });
    const ip = { 'x-forwarded-for': '203.0.113.7' };
    // Same IP, DIFFERENT rotating sessionIds — must still be capped.
    const a = await post(base, { message: 'about Claude', sessionId: 'rot-1' }, ip);
    const b = await post(base, { message: 'about Claude', sessionId: 'rot-2' }, ip);
    expect(a.status).toBe(200);
    expect(b.status).toBe(429);
    // A different IP is unaffected.
    const c = await post(base, { message: 'about Claude', sessionId: 'rot-3' }, { 'x-forwarded-for': '203.0.113.9' });
    expect(c.status).toBe(200);
  });

  it('enforces the global daily cap as a backstop', async () => {
    const base = boot({ dailyCap: new GlobalDailyCap(1) });
    const a = await post(base, { message: 'about Claude', sessionId: 'd1' }, { 'x-forwarded-for': '198.51.100.1' });
    const b = await post(base, { message: 'about Claude', sessionId: 'd2' }, { 'x-forwarded-for': '198.51.100.2' });
    expect(a.status).toBe(200);
    expect(b.status).toBe(429);
  });
});

const SECRET = 'top-secret-token';

/** Boot a server with a Telegram channel whose fetch is stubbed (no network). */
function bootWithTelegram() {
  const fetchImpl = vi.fn(
    async () => new Response(JSON.stringify({ ok: true, result: [] }), { status: 200 }),
  ) as unknown as typeof fetch;
  const telegram = new TelegramChannel({
    token: 'TEST:TOKEN',
    provider: new MockProvider(),
    tools: TOOLS,
    fetchImpl,
  });
  return boot({ telegram, webhookSecret: SECRET });
}

const webhook = (base: string, headers: Record<string, string> = {}) =>
  fetch(`${base}/telegram/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ update_id: 1, message: { chat: { id: 5 }, text: 'about Claude' } }),
  });

describe('server /telegram/webhook (header-only auth)', () => {
  it('403s a request with NO secret-token header', async () => {
    const base = bootWithTelegram();
    const r = await webhook(base);
    expect(r.status).toBe(403);
  });

  it('403s a request with the WRONG secret-token header', async () => {
    const base = bootWithTelegram();
    const r = await webhook(base, { 'x-telegram-bot-api-secret-token': 'nope' });
    expect(r.status).toBe(403);
  });

  it('accepts (200) a request with the CORRECT secret-token header', async () => {
    const base = bootWithTelegram();
    const r = await webhook(base, { 'x-telegram-bot-api-secret-token': SECRET });
    expect(r.status).toBe(200);
    expect((await r.json()) as { ok: boolean }).toEqual({ ok: true });
  });

  it('404s the OLD secret-in-URL path (no longer routed)', async () => {
    const base = bootWithTelegram();
    const r = await fetch(`${base}/telegram/${SECRET}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
      body: '{}',
    });
    expect(r.status).toBe(404);
  });
});
