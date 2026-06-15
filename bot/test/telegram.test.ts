import { describe, it, expect, vi } from 'vitest';
import { TelegramChannel, formatReply, type TelegramUpdate } from '../src/channels/telegram.js';
import { MockProvider } from '../src/provider.js';
import { RateLimiter, GlobalDailyCap } from '../src/rate-limit.js';
import type { Citation, ToolData } from '../src/types.js';

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

function channel(opts: { perMinute?: number; dailyCap?: GlobalDailyCap; allowedChatIds?: Set<string> } = {}) {
  const calls: { url: string; body: unknown }[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : undefined });
    return new Response(JSON.stringify({ ok: true, result: [] }), { status: 200 });
  }) as unknown as typeof fetch;
  const ch = new TelegramChannel({
    token: 'TEST:TOKEN',
    provider: new MockProvider(),
    tools: TOOLS,
    fetchImpl,
    limiter: new RateLimiter(opts.perMinute ?? 12),
    dailyCap: opts.dailyCap,
    allowedChatIds: opts.allowedChatIds,
  });
  return { ch, calls };
}

const cite = (tool?: string): Citation => ({ module: 'Module 1', lesson: 'Lesson 1', tool, snippet: 'x' });

const msg = (chatId: number, text: string): TelegramUpdate => ({
  update_id: 1,
  message: { chat: { id: chatId }, text, from: { id: chatId } },
});

describe('TelegramChannel', () => {
  it('greets and resets on /start', async () => {
    const { ch, calls } = channel();
    const out = await ch.handleUpdate(msg(42, '/start'));
    expect(out).toContain("I'm Tutor");
    expect(calls.at(-1)!.url).toContain('/sendMessage');
    expect((calls.at(-1)!.body as { chat_id: string }).chat_id).toBe('42');
  });

  it('answers a tool question and sends a reply', async () => {
    const { ch, calls } = channel();
    const out = await ch.handleUpdate(msg(7, 'tell me about Claude'));
    expect(out).toBeTruthy();
    const sent = (calls.at(-1)!.body as { text: string }).text;
    expect(sent).toContain('Claude');
    expect(calls.at(-1)!.url).toContain('/sendMessage');
  });

  it('ignores non-text and unknown updates', async () => {
    const { ch } = channel();
    expect(await ch.handleUpdate({})).toBeNull();
    expect(await ch.handleUpdate({ message: { chat: { id: 1 } } })).toBeNull();
  });

  it('rate-limits a chatty user', async () => {
    const { ch } = channel({ perMinute: 1 });
    await ch.handleUpdate(msg(9, 'first question about Claude'));
    const second = await ch.handleUpdate(msg(9, 'another question'));
    expect(second).toContain('going a bit fast');
  });

  it('keeps separate sessions per chat id (isolation)', async () => {
    const { ch } = channel();
    await ch.handleUpdate(msg(100, 'about Claude'));
    expect(ch.session.history('100').length).toBeGreaterThan(0);
    expect(ch.session.history('200')).toHaveLength(0);
  });

  it('ignores chat ids not on the allowlist (no reply)', async () => {
    const { ch, calls } = channel({ allowedChatIds: new Set(['100']) });
    expect(await ch.handleUpdate(msg(999, 'about Claude'))).toBeNull();
    expect(calls).toHaveLength(0); // nothing sent back to a stranger
  });

  it('answers an allowlisted chat id', async () => {
    const { ch } = channel({ allowedChatIds: new Set(['100']) });
    expect(await ch.handleUpdate(msg(100, 'about Claude'))).toBeTruthy();
  });

  it('blocks once the global daily cap is exhausted', async () => {
    const t = 1_000_000;
    const cap = new GlobalDailyCap(1, () => t);
    const { ch } = channel({ dailyCap: cap });
    await ch.handleUpdate(msg(5, 'first about Claude'));
    const second = await ch.handleUpdate(msg(6, 'second about Claude'));
    expect(second).toContain('limit for today');
  });
});

describe('formatReply', () => {
  it('renders a clean Sources line with deduped tool names', () => {
    const out = formatReply('Answer.', [cite('Claude'), cite('Claude'), cite('ChatGPT')]);
    expect(out).toContain('Answer.');
    expect(out).toContain('Sources: Claude · ChatGPT');
    expect(out).not.toContain('[Source:'); // no raw citation markup
    expect(out.match(/Claude/g)!.length).toBe(1);
  });
  it('omits the footer for tool-less (general) citations', () => {
    expect(formatReply('Just text.', [cite(undefined)])).toBe('Just text.');
  });
  it('returns text unchanged with no citations', () => {
    expect(formatReply('Just text.', [])).toBe('Just text.');
  });
});
