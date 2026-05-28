import { afterEach, describe, expect, it } from 'vitest';
import {
  consumeGoogleChatbotRequest,
  resetGoogleChatbotUsageState,
} from '@/lib/llm/google-usage';

afterEach(() => {
  resetGoogleChatbotUsageState();
});

describe('consumeGoogleChatbotRequest', () => {
  it('throws once the configured daily cap is exceeded', () => {
    const env = { GOOGLE_CHATBOT_DAILY_LIMIT: '2' };
    const now = new Date('2026-05-28T14:00:00Z');
    consumeGoogleChatbotRequest(env, now);
    consumeGoogleChatbotRequest(env, now);
    expect(() => consumeGoogleChatbotRequest(env, now)).toThrow(/daily cap/i);
  });

  it('resets count across Pacific day boundaries', () => {
    const env = { GOOGLE_CHATBOT_DAILY_LIMIT: '1' };
    // 23:59 Pacific on May 28, then 00:01 Pacific on May 29.
    consumeGoogleChatbotRequest(env, new Date('2026-05-29T06:59:00Z'));
    expect(() =>
      consumeGoogleChatbotRequest(env, new Date('2026-05-29T07:01:00Z')),
    ).not.toThrow();
  });
});
