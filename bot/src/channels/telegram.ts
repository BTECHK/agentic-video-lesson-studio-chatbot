import type { BrainDeps } from '../brain.js';
import { respond } from '../brain.js';
import { SessionStore } from '../session.js';
import { RateLimiter } from '../rate-limit.js';

/** Minimal Telegram Update shape (only what we use). */
export interface TelegramUpdate {
  update_id?: number;
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number };
  };
}

export interface TelegramDeps extends BrainDeps {
  token: string;
  session?: SessionStore;
  limiter?: RateLimiter;
  /** injectable for tests; defaults to global fetch */
  fetchImpl?: typeof fetch;
}

const API = 'https://api.telegram.org';

export class TelegramChannel {
  readonly session: SessionStore;
  private limiter: RateLimiter;
  private fetchImpl: typeof fetch;

  constructor(private deps: TelegramDeps) {
    this.session = deps.session ?? new SessionStore();
    this.limiter = deps.limiter ?? new RateLimiter();
    this.fetchImpl = deps.fetchImpl ?? fetch;
  }

  /** Handle one update: route text → brain → reply. Returns the reply text sent
   * (or null if nothing actionable / rate-limited). Pure enough to unit-test. */
  async handleUpdate(update: TelegramUpdate): Promise<string | null> {
    const msg = update.message;
    const text = msg?.text?.trim();
    if (!msg || !text) return null;
    const chatId = String(msg.chat.id);

    if (text === '/start') {
      this.session.reset(chatId);
      const hello =
        "Hi, I'm Tutor — your Sample Academy assistant. Ask me anything about the AI tools in the course and I'll point you to the right lesson.";
      await this.send(chatId, hello);
      return hello;
    }

    if (!this.limiter.allow(chatId)) {
      const slow = "You're going a bit fast for me — give it a few seconds and ask again.";
      await this.send(chatId, slow);
      return slow;
    }

    const firstTurn = this.session.isFirstTurn(chatId);
    const history = this.session.append(chatId, { role: 'user', content: text });
    const reply = await respond(history, firstTurn, this.deps);
    const out = formatReply(reply.text, reply.citations.map((c) => c.snippet));
    this.session.append(chatId, { role: 'assistant', content: reply.text });
    await this.send(chatId, out);
    return out;
  }

  /** Send a plain-text message (no HTML/Markdown parse_mode → no injection-driven
   * formatting; output is treated as untrusted). */
  async send(chatId: string, text: string): Promise<void> {
    await this.fetchImpl(`${API}/bot${this.deps.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }),
    });
  }

  async setWebhook(url: string, secretToken: string): Promise<void> {
    await this.fetchImpl(`${API}/bot${this.deps.token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, secret_token: secretToken, drop_pending_updates: true }),
    });
  }

  /** Long-poll loop for local pilot (no public URL needed). Cancels on signal. */
  async longPoll(signal?: AbortSignal): Promise<void> {
    let offset = 0;
    while (!signal?.aborted) {
      const res = await this.fetchImpl(
        `${API}/bot${this.deps.token}/getUpdates?timeout=30&offset=${offset}`,
        { signal },
      );
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      const data = (await res.json()) as { result?: TelegramUpdate[] };
      for (const update of data.result ?? []) {
        offset = Math.max(offset, (update.update_id ?? 0) + 1);
        try {
          await this.handleUpdate(update);
        } catch (err) {
          console.error('handleUpdate error', err);
        }
      }
    }
  }
}

export function formatReply(text: string, citationSnippets: string[]): string {
  if (citationSnippets.length === 0) return text;
  const unique = [...new Set(citationSnippets)];
  return `${text}\n\n— ${unique.map((s) => `[${s}]`).join('  ')}`;
}
