import { makeProvider } from './provider.js';
import { loadTools } from './tools.js';
import { TelegramChannel } from './channels/telegram.js';
import { startServer } from './server.js';
import { SessionStore } from './session.js';
import { RateLimiter, GlobalDailyCap } from './rate-limit.js';
import { assertWebhookConfigSafe } from './webhook-config.js';

/**
 * Entrypoint. Two channels share one brain:
 *  - HTTP server (Cloud Run): web test page + /chat + /telegram webhook + /healthz
 *  - Telegram long-poll (local pilot): no public URL needed
 *
 * TELEGRAM_MODE=webhook (default on Cloud Run) registers the webhook against
 * PUBLIC_URL and serves it from the HTTP server. TELEGRAM_MODE=longpoll runs the
 * dial-out loop alongside the server (handy locally).
 */
async function main(): Promise<void> {
  const provider = makeProvider();
  const tools = loadTools();
  const maxOutputTokens = Number(process.env.MAX_OUTPUT_TOKENS ?? 600);
  console.log(`[tutor-bot] provider=${provider.name} tools=${tools.length}`);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const mode = process.env.TELEGRAM_MODE ?? 'longpoll';
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  assertWebhookConfigSafe(token, mode, webhookSecret);

  // One global daily cap shared across BOTH channels (quota/spend circuit breaker).
  const dailyCap = new GlobalDailyCap();
  const allowlist = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedChatIds = allowlist.length ? new Set(allowlist) : undefined;
  if (allowedChatIds) console.log(`[tutor-bot] Telegram allowlist active (${allowedChatIds.size} chat id(s)).`);

  let telegram: TelegramChannel | undefined;
  if (token) {
    telegram = new TelegramChannel({
      token,
      provider,
      tools,
      maxOutputTokens,
      session: new SessionStore(),
      limiter: new RateLimiter(),
      dailyCap,
      allowedChatIds,
    });
  } else {
    console.warn('[tutor-bot] TELEGRAM_BOT_TOKEN unset — Telegram channel disabled (web /chat still works).');
  }

  // Cloud Run requires an HTTP listener on $PORT; always start the server.
  startServer({ provider, tools, maxOutputTokens, telegram, webhookSecret, dailyCap });

  if (telegram) {
    if (mode === 'webhook') {
      const base = process.env.PUBLIC_URL;
      if (!base || !webhookSecret) {
        console.error('[tutor-bot] webhook mode needs PUBLIC_URL + TELEGRAM_WEBHOOK_SECRET.');
      } else {
        await telegram.setWebhook(`${base.replace(/\/$/, '')}/telegram/webhook`, webhookSecret);
        console.log('[tutor-bot] Telegram webhook registered.');
      }
    } else {
      console.log('[tutor-bot] Telegram long-poll started.');
      telegram.longPoll().catch((e) => console.error('longPoll', e));
    }
  }
}

main().catch((err) => {
  console.error('[tutor-bot] fatal', err);
  process.exit(1);
});
