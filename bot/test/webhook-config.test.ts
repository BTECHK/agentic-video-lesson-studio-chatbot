import { describe, it, expect } from 'vitest';
import { assertWebhookConfigSafe } from '../src/webhook-config.js';

describe('assertWebhookConfigSafe', () => {
  it('rejects webhook mode + bot token with no secret (fail closed)', () => {
    expect(() => assertWebhookConfigSafe('bot-token', 'webhook', undefined)).toThrow(
      /TELEGRAM_WEBHOOK_SECRET/,
    );
  });

  it('rejects webhook mode + bot token with an empty-string secret', () => {
    expect(() => assertWebhookConfigSafe('bot-token', 'webhook', '')).toThrow(/TELEGRAM_WEBHOOK_SECRET/);
  });

  it('allows webhook mode when the secret is set (happy path)', () => {
    expect(() => assertWebhookConfigSafe('bot-token', 'webhook', 'a-real-secret')).not.toThrow();
  });

  it('allows longpoll mode with no secret (webhook route is irrelevant)', () => {
    expect(() => assertWebhookConfigSafe('bot-token', 'longpoll', undefined)).not.toThrow();
  });

  it('allows no token at all regardless of mode (Telegram channel disabled)', () => {
    expect(() => assertWebhookConfigSafe(undefined, 'webhook', undefined)).not.toThrow();
  });
});
