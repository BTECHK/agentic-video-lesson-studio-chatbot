/**
 * Fail CLOSED: webhook mode with a bot token but no secret would otherwise mount
 * `/telegram/undefined` (server.ts) with its header check short-circuited off —
 * a zero-auth route. Refuse to start rather than serve that silently. Kept in its
 * own module (not index.ts) so tests can import it without triggering index.ts's
 * self-invoking main().
 */
export function assertWebhookConfigSafe(
  token: string | undefined,
  mode: string,
  webhookSecret: string | undefined,
): void {
  if (token && mode === 'webhook' && !webhookSecret) {
    throw new Error(
      '[tutor-bot] refusing to start: TELEGRAM_MODE=webhook with TELEGRAM_BOT_TOKEN set requires ' +
        'TELEGRAM_WEBHOOK_SECRET (Cloud Run wires this from Secret Manager). Set it or use TELEGRAM_MODE=longpoll.',
    );
  }
}
